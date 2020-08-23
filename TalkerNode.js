// https://github.com/marado/TalkerNode

"use strict";
var net = require('net');
var crypto = require('crypto');
var valid = require('password-strength');
var chalk = require('chalk');
const stripAnsi = require('strip-ansi');

var sockets = [];
var port = process.env.PORT || 8888;
var version = require('./package.json').version;

// Instantiates the users database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync')
var loadeddb = 0; // number of databases loaded so far // TODO: this probably is no longer needed with lowdb
const usersadapter = new FileSync('user.db');
const usersdb = low(usersadapter);
loadeddb++;

// Instantiates the talker settings database
var commands = {};
const talkeradapter = new FileSync('talker.db');
const talkerdb = low(talkeradapter);

var ranks = talkerdb.get('ranks').value();
if (typeof ranks === 'undefined') {
	ranks = {list:[
			"Jailed",
			"Newcomer",
			"Newbie",
			"Juvie",
			"Learner",
			"Adult",
			"Wiseman",
			"Hero",
			"Mage",
			"Imortal",
			"God"
		], entrylevel: 10};
	talkerdb.set("ranks", ranks).write();
}

var watchdog = talkerdb.get('watchdog').value();
if (typeof watchdog === 'undefined') {
	// value in seconds; if set to 0 watchdog feature will be disabled
	watchdog = 24*60*60;
	talkerdb.set("watchdog", watchdog).write();
}

loadeddb++;

// Instantiates the universe
var nodiverse = require('nodiverse');
var universe;
var talkername = "Moosville"; // TODO: make this configurable
const universeadapter = new FileSync('universe.db');
const universedb = low(universeadapter);
universe = universedb.get("universe").value();
if (typeof universe === 'undefined') {
	universe = nodiverse(); // new universe
	universe.create([0,0,0],0);
	var limbo = universe.get([0,0,0]);
	limbo.name = "Limbo"; // at the beginning there was just the limbo
	universe.update(limbo);
	universe.entrypoint=[0,0,0]; // where everyone was meant to be
	universedb.set("universe", universe).write();
} else {
	// assign the correct prototype to universe
	// this is somewhat ugly, since we're falling back from
	// Object.?etPrototypeOf to __proto__ in order not to depend on
	// nodejs 0.12
	// TODO: now that we already depend on a nodejs >= 0.12, this ugly hack
        //       can be cleaned up
	var setProtoOf = function(obj, proto) { obj.__proto__ = proto; };
	var mixinProperties = function(obj, proto) {
		for (var prop in proto) { obj[prop] = proto[prop]; }
	};
	var setPrototypeOf = Object.setPrototypeOf ||
		{__proto__:[]} instanceof Array ? setProtoOf : mixinProperties;
	var getPrototypeOf = Object.getPrototypeOf ||
		function(obj) { return obj.__proto__; };
	setPrototypeOf(universe, getPrototypeOf(nodiverse()));
}
if (typeof universe.name !== 'undefined') talkername = universe.name;
loadeddb++;

/*
 * Returns a standard formatted date time string
 */
function getDateTimeString(datetimestring=0) {
	var datetime = (datetimestring > 0) ? new Date(datetimestring) : Date();
	return datetime.toString().split(' ').slice(0,6).join(' ');
}

/*
 * Cleans the input of carriage return, newline and control characters
 */
function cleanInput(data) {
	var newString = data.toString().replace("[\u0000-\u001a]", "").replace("[\u001c-\u001f]", "").replace(/(\r\n|\n|\r)/gm,"").replace(/\u001b\[./gm,"");
	while (newString.charAt(0) === " ") newString=newString.substring(1);
	return newString;
}

/*
 * Turns client's echo on or off. echo off is usually wanted on passwords
 */
function echo(bool) {
    var bytes = Array(3);
    bytes[0] = 0xFF;
    bytes[1] = bool ? 0xFC : 0xFB; //  0xFF 0xFC 0x01 for off,  0xFF 0xFB 0x01 for on
    bytes[2] = 0x01;
    return new Buffer.from(bytes);
}

/*
* Saves total time for user or all users to the db
*/
function saveTotalTime(username) {
	if(typeof username === 'undefined') { // save time for all users
		for (let index = 0; index < sockets.length; index++) {
			const socket = sockets[index];
			var socketdb = usersdb.get(socket.username).value();
			if (typeof socketdb !== 'undefined') {
				if (typeof socketdb.totalTime === 'undefined') {
					socketdb.totalTime = (Date.now() - socketdb.loginTime);
				} else {
					socketdb.totalTime += (Date.now() - socketdb.loginTime);
				}
				usersdb.set(socket.username, socketdb).write();
			}
		}
	} else { // save time for given user
		var userdb = usersdb.get(username).value();
		if (typeof userdb !== 'undefined') {
			if (typeof userdb.totalTime === 'undefined') {
				userdb.totalTime = (Date.now() - userdb.loginTime);
			} else {
				userdb.totalTime += (Date.now() - userdb.loginTime);
			}
			usersdb.set(username, userdb).write();
		}
	}
}

/*
 * Method used to send data to a socket
 */
function sendData(socket, data) {
	var datalines;
	if (typeof(data) === 'object') {
		var decoder;
		if (typeof TextDecoder === 'undefined') {
			// 8.3.0 <= nodejs < 11
			decoder = require('util').TextDecoder;
		} else {
			// nodejs >= 11
			decoder = TextDecoder;
		}
		datalines = new decoder("utf-8").decode(data).split(/\r\n|\r|\n/).length;
	} else {
		datalines = data.split(/\r\n|\r|\n/).length;
	}
	try {
		if (typeof socket.db === 'undefined' ||
			typeof socket.db.pager === 'undefined' ||
			parseInt(socket.db.pager) === 0 ||
			parseInt(socket.db.pager) >= datalines
		) {
			if (typeof socket.db !== 'undefined' && typeof socket.db.color !== 'undefined' && !(socket.db.color)) {
				socket.write(stripAnsi(data));
			} else {
				socket.write(data);
			}
		} else {
			// TODO: react to socket.db.pager :
			// cut the message in two, send the first, save the second
			// - and get ready an interactive mechanism, like the one used in .pass, for eg.
			//
			// While that's not done...
			// socket.write("This message should be cut and within a pager.\r\n");
			if (typeof socket.db !== 'undefined' && typeof socket.db.color !== 'undefined' && !(socket.db.color)) {
				socket.write(stripAnsi(data));
			} else {
				socket.write(data);
			}
		}
	} catch (e) {
	    // This is being left intentionally empty: socket.write failures
	    // can, and are expected to happen, but we can ignore that and
	    // proceed in those cases.
	}
}

/*
 * Method executed when data is received from a socket
 */
function receiveData(socket, data) {

	var cleanData = cleanInput(data);

	if(cleanData.length == 0)
		return;

	// Useful when in debug mode, you don't want this otherwise... it wouldn't be nice for your users' privacy, would it?
	// console.log("Moo [" + cleanData + "]");

	// TODO: We're just filtering out IAC commands. We should be dealing with them instead...
	//       See: https://github.com/marado/TalkerNode/issues/34
	// IAC commands
	var IAC = [
		1 , // Telnet IAC - Echo
		3 , // Telnet IAC - Suppress Go Ahead
		5 , // Telnet IAC - Status
		6 , // Telnet IAC - Timing Mark
		24, // Telnet IAC - Terminal Type
		31, // Telnet IAC - Window Size
		33, // Telnet IAC - Remote Flow Control
		34, // Telnet IAC - Linemode
		36, // Telnet IAC - Environment Variables
		65533 // reply to echo off
	];
	if (IAC.indexOf(cleanData.charCodeAt(0)) !== -1) {
		// This is IAC, not an user input
		// console.log("Moo: IAC: [" + cleanData.charCodeAt(0) +"]");
		return;
	}

	sendData(socket, echo(true));
	if(socket.username == undefined) {
		if (cleanData.toLowerCase() === "quit") return socket.end('Goodbye!\r\n');
		if (cleanData.toLowerCase() === "who") { socket.db={rank:0}; doCommand(socket, ".who"); return sendData(socket, chalk.cyan("Give me a name:  ")); }
		if (cleanData.toLowerCase() === "version") { socket.db={rank:0}; doCommand(socket, ".version"); return sendData(socket, chalk.cyan("Give me a name:  ")); }
		var reservedNames=["who","quit","version"];
		if (reservedNames.indexOf(cleanData.toLowerCase()) > -1) {
			sendData(socket, "\r\nThat username is reserved, you cannot have it.\r\n" + chalk.cyan("Give me a name:  "));
		}
		else if ((cleanData.match(/^[a-zA-Z]+$/) !== null) && (1 < cleanData.length) && (cleanData.length < 17)) {
			socket.username = cleanData.toLowerCase().charAt(0).toUpperCase() + cleanData.toLowerCase().slice(1); // Capitalized name
			socket.loggedin = false;
			socket.db = usersdb.get(socket.username).value();
			if (typeof socket.db === 'undefined') {
				sendData(socket, chalk.cyan("\r\nNew user, welcome! Please choose a password: "));
				sendData(socket, echo(false));
				socket.registering=true;
			} else {
				sendData(socket, chalk.cyan("\r\nGive me your password: "));
				sendData(socket, echo(false));
				socket.registering=false;
			}
			return;
		} else {
			sendData(socket, chalk.red(
			    "\r\nInvalid username: it can only contain letters, have at least two characters and be no longer than 16 characters.\r\n") +
			    chalk.cyan("Give me a name:  "
			));
		}
		return;
	} else if (socket.loggedin == false) {
		// this is the password
		if (socket.registering) {
			if (typeof socket.password === 'undefined') {
				if ((cleanData.toLowerCase() === socket.username.toLowerCase()) || !valid(cleanData).valid) {
				    sendData(socket, chalk.red("\r\nThat password is not valid"));
				    if (valid(cleanData).hint !== null) sendData(socket, " (" + valid(cleanData).hint + ")");
				    sendData(socket, chalk.red(". ") + "Let's try again...\r\n" + chalk.cyan("Give me a name:  "));
				    delete socket.registering;
				    delete socket.username;
				    delete socket.loggedin;
				    delete socket.db;
				    return;
				}
				socket.password = crypto.createHash('sha512').update(cleanData).digest('hex');
				sendData(socket, echo(false));
				sendData(socket, chalk.cyan("\r\nConfirm the chosen password: "));
				return;
			} else {
				if (socket.password === crypto.createHash('sha512').update(cleanData).digest('hex')) {
					// password confirmed
					socket.db={
					    "password":crypto.createHash('sha512').update(cleanData).digest('hex'),
					    "rank":ranks.entrylevel,
					    "where":universe.entrypoint,
					    "registerTime":Date.now(),
					};
					if (ranks.list.length - 1 == ranks.entrylevel) {
						if (ranks.list.length == 1) {
							ranks.entrylevel = 0;
						} else {
							ranks.entrylevel = 1;
						}
						talkerdb.set("ranks", ranks).write();
					}
					usersdb.set(socket.username, socket.db).write();
					delete socket.password;
					delete socket.registering;
				} else {
					// wrong confirmation password
					delete socket.password;
					delete socket.registering;
					delete socket.username;
					delete socket.db;
					sendData(socket, chalk.red("\r\nPasswords don't match!") + "\r\nLet's start from the beggining...\r\n" + chalk.cyan("Tell me your name:  "));
					return;
				}
			}
		} else if (socket.db.password !== crypto.createHash('sha512').update(cleanData).digest('hex')) {
			require("fs").appendFileSync('auth.log', new Date().toISOString() + " " + socket.remoteAddress + " with port " + socket.remotePort + " failed to log in, username attempted was: " + socket.username + "\r\n");
			delete socket.username;
			delete socket.db;
			sendData(socket, chalk.red("\r\nWrong password! ") + "\r\nLet's start from the beggining...\r\n" + chalk.cyan("Tell me your name:  "));
			return;
		}

		// entering the talker...
		require("fs").appendFileSync('auth.log', new Date().toISOString() + " " + socket.remoteAddress + " with port " + socket.remotePort + " successfully logged in, username is: " + socket.username + "\r\n");
		if (universe.get(socket.db.where) === null) { // there's no where, or that place doesn't exist anymore
			socket.db.where = universe.entrypoint;
			// save changes into the database
			var tmp = usersdb.get(socket.username).value();
			tmp.where = socket.db.where;
			usersdb.set(socket.username, tmp).write();
		}
		if (command_utility().allButMe(socket,function(me,to){if(to.username.toLowerCase()===me.username.toLowerCase()){return true;}})) {
			var old = command_utility().allButMe(socket,function(me,to){if(to.username.toLowerCase()===me.username.toLowerCase()){to.end('Session is being taken over...\n');}});
			sendData(socket, 'Taking over session...\n');
		} else {
			socket.lastLogin = socket.db.loginTime;
			socket.db.loginTime = Date.now();
			if (typeof(socket.db.loginCount) === "undefined") {
			    socket.db.loginCount = 1;
			} else {
			    socket.db.loginCount++;
			}
			socket.activityTime = Date.now();
			command_utility().allButMe(socket,function(me,to){to.write("[Entering is: "+ me.username + " (" + universe.get(me.db.where).name + " " + me.db.where + ") ]\r\n");});
		}
		sendData(socket, "\r\n+----------------------------------------------------------------------------+\r\n");
		sendData(socket, " Welcome to " + chalk.bold(talkername) + ", " + chalk.green(socket.username) + "!\r\n");
		if (typeof(socket.lastLogin) !== "undefined") {
			sendData(
				socket,
				" Your last login was at "
					+ chalk.magenta(getDateTimeString(
						socket.lastLogin
					)) + ".\r\n"
			);
		}
		sendData(socket, " Your rank is " + chalk.bold(ranks.list[socket.db.rank]) + ".\r\n");
		sendData(socket, "+----------------------------------------------------------------------------+\r\n");
		socket.loggedin = true;
		doCommand(socket, ".look");
		return;
	} else if (typeof socket.interactive !== 'undefined') {
		switch (socket.interactive.type) {
			case "password":
				if (socket.interactive.state === "old") {
					// let's confirm the password
					if (socket.db.password !== crypto.createHash('sha512').update(cleanData).digest('hex')) {
						sendData(socket, "\r\n:: " + chalk.red("Wrong password!\r\n"));
						delete socket.interactive;
					} else {
						// password is correct
						sendData(socket, "\r\n:: " + chalk.green("Tell me the new password: "));
						sendData(socket, echo(false));
						socket.interactive.state = "new";
					}
				} else {
					// let's set cleanData as the new password
					if ((cleanData.toLowerCase() === socket.username.toLowerCase()) || !valid(cleanData).valid) {
					    sendData(socket, chalk.red("\r\nThat password is not valid"));
					    if (valid(cleanData).hint !== null) sendData(socket, " (" + valid(cleanData).hint + ")");
					    sendData(socket, chalk.red(". Password not changed.\r\n"));
					    delete socket.interactive;
					    return;
					}
					socket.db.password = crypto.createHash('sha512').update(cleanData).digest('hex');
					usersdb.set(socket.username, socket.db).write();
					sendData(socket, "\r\n:: " + chalk.cyan("Password changed, now don't you forget your new password!\r\n"));
					delete socket.interactive;
				}
				break;
			case "suicide":
				if (socket.interactive.state === "confirmation") {
					if (cleanData === "yes, I am sure") {
						// they really want to .suicide, let's validate they are who they're supposed to be...
						sendData(socket, chalk.bold("\r\n:: Alright then... just confirm you're who're you supposed to be, tell us your password: "));
						sendData(socket, echo(false));
						socket.interactive.state = "pass";
					} else {
						sendData(socket, chalk.bold("\r\n:: Ooof, we're glad you don't want to leave us!\r\n"));
						delete socket.interactive;
					}
				} else {
					// let's confirm the password
					if (socket.db.password !== crypto.createHash('sha512').update(cleanData).digest('hex')) {
						sendData(socket, "\r\n:: " + chalk.red("Wrong password!\r\n"));
						delete socket.interactive;
					} else {
						// password is correct
						sendData(socket, chalk.gray("\r\n:: Deleting all your data... We're sad to see you go!\r\n"));
						command_utility().allButMe(socket,function(me,to){to.write("[Leaving is: "+ me.username + " ]\r\n");});
						delete socket.interactive;
						var quitter = socket.username;
						socket.end(":'(\r\n");
						// actually delete the user
						var users = usersdb.getState();
						delete users[quitter];
						usersdb.setState(users).write();
					}
				}
				break;
			default:
				sendData(socket, "\r\n:: Something really weird just happened... let's try to recover from it...\r\n");
				delete socket.interactive;
				break;
		}
		return;
	}

	// if we have a command...
	if (cleanData === ".") {
		if ((typeof socket.lastcommand) !== 'undefined')
			doCommand(socket, socket.lastcommand);
	} else if (cleanData.charAt(0) === ".") {
		doCommand(socket, cleanData);
	} else {
		doCommand(socket, ".say " + cleanData);
	}

}

/*
 * Load all commands from the command subdirectory
 */
function loadCommands() {
	// Loop through all files, trying to load them
	var normalizedPath = require("path").join(__dirname, "commands");
	var output = "";
	require("fs").readdirSync(normalizedPath).forEach(function(file) {
		if (file.substr(file.length-3, 3) === ".js") {
			try {
				delete require.cache[require.resolve('./commands/' + file)]
				var cmd_load = require('./commands/' + file);
				var cmd = cmd_load.command;

				// Only load the command if it's set to Autoload
				if(cmd.autoload) {
					output += "Loading Command: Command '"
						+ cmd.name + "' loaded (from '"
						+ file + "')\r\n";
					cmd.loaded_date = new Date();
					commands[cmd.name] = cmd;
				} else {
					output += "Loading Command: Skipping "
						+ cmd.name + " (from '"
						+ file
						+ "'). Autoload = false\r\n";
				}
			} catch (e) {
				throw file + ": " + e;
			}
		} else {
			output += "Skipping " + file + ": file extension is not 'js'\r\n";
		}
	});
	return output;
}

/*
 * Method that returns the command rank.
 * If a custom one exists, use it. Else, use the hardcoded one.
 * In any case, validate if there's a rank as higher as the one of the command.
 * If not, assign it to the highest rank available.
 * If the command doesn't exist at all, return null.
 */
function getCmdRank(command) {
	var r;
	var cmdRanks = talkerdb.get("commands").value();
	if (typeof (cmdRanks) !== 'undefined' && typeof (cmdRanks[command]) !== 'undefined') {
		r = cmdRanks[command];
	} else if (commands[command]) {
		r = commands[command].min_rank;
	} else {
		return null;
	}
	if (r >= ranks.list.length) r = ranks.list.length - 1;
	return r;
}

/*
 * Method that changes the command rank.
 */
function setCmdRank(command, rank) {
	var cmdRanks = talkerdb.get("commands").value();
	if (typeof(cmdRanks) === 'undefined') cmdRanks = {};
	if (commands[command]) {
		var old = commands[command].min_rank;
		if (typeof (cmdRanks[command]) !== 'undefined') {
			old = cmdRanks[command];
		}
		if (rank != old) {
			cmdRanks[command] = rank;
		    talkerdb.set("commands", cmdRanks).write();
		}
	}
}

/*
 * Method to find a command
 * hierarchy: direct match > alias direct match > weighted partial match
 * The 'weigthed partial match' gives precedence to commands of lower ranks
 */
function findCommand(socket, command) {
	var c = command;
	var userRank = socket.db.rank;
	if(commands[c] && userRank >= getCmdRank(c)) {
		// direct match
		return [commands[c]];
	} else {
		// when we have more than one possible command, we
		// choose the most heavier from the ones with lower
		// getCmdRank
		var results = [];
		var weigth = 0;
		var rank = ranks.list.length - 1;
		for (var cmd in commands) {
			// alias direct match
			if (
				commands[cmd].alias !== 'undefined' &&
				commands[cmd] !== "" && commands[cmd].alias === c
			) {
				return [commands[cmd]];
			}
			// partial match
			if(cmd.substr(0, c.length) == c &&
				userRank >= getCmdRank(cmd))
			{
				var cweigth = 0;
				if (typeof commands[cmd].weigth !== 'undefined')
					cweigth = commands[cmd].weigth;
				if (getCmdRank(cmd) < rank) {
					rank = getCmdRank(cmd);
					weigth = cweigth;
					results = [commands[cmd]];
				} else if (getCmdRank(cmd) === rank) {
					if (cweigth > weigth) {
						weigth = commands[cmd].weigth;
						results = [commands[cmd]];
					} else if (cweigth === weigth) {
						results.push(commands[cmd]);
					}
				}
			}
		}
		return results;
	}
}

/*
 * Method to execute commands.
 */
function doCommand(socket, command) {
	socket.activityTime = Date.now();
	try {
		var c = command.split(' ')[0].toLowerCase().substring(1);
		var userRank = socket.db.rank;
		var cArr = findCommand(socket, c);
		if (cArr.length === 1) {
			socket.lastcommand = command;
			return cArr[0].execute(socket, command.split(' ').slice(1).join(" "), command_utility())
		}
		if (cArr.length > 1) {
			var possibilities = "";
			for (var p = 0; p < cArr.length - 1; p++) {
			    possibilities += cArr[p].name + ", ";
			}
			possibilities += cArr[cArr.length - 1].name;
			return sendData(socket, "Found " + cArr.length + " possible commands (" + possibilities + "). Please be more specific.\r\n");
		} else {
			return sendData(socket, "There's no such thing as a " + c + " command.\r\n");
		}
	}
	catch(err) {
		sendData(socket, "Error executing command '" + c + "': " + err + "\r\n");
		console.error("Error executing command '" + c + "': " + err + "\r\n");
	}
}

/*
 * Method executed when a socket ends
 */
function closeSocket(socket) {
	var i = sockets.indexOf(socket);
	if (i != -1) {
		// if the socket already belong to a user...
		if (typeof socket.username !== 'undefined') {
			// announce the user departure
			command_utility().allButMe(socket,function(me,to){
				try {
					to.write(chalk.bold(
						"[" + chalk.red("Leaving ") +
						"is: " +
						chalk.yellow(me.username) +
						" ]\r\n"
					));
				} catch(err) {
					// there are expectable and non-fatal
					// errors that can happen here, but
					// there can also be bugs. Let's print
					// the error out so logs can be useful.
					console.log(
						"E: closeSocket's " +
						"announcement failed for " +
						"one socket: " + err
					);
				}
			});
			// write total time on socket db
			saveTotalTime(sockets[i].username);
		}
		sockets.splice(i, 1);
	}
}

/*
 * Callback method executed when a new TCP socket is opened.
 */
function newSocket(socket) {
	require("fs").appendFileSync('auth.log', new Date().toISOString() + " " + socket.remoteAddress + " connected with port " + socket.remotePort + "\r\n");
	socket.setKeepAlive(true);
	// FIXME: socket errors are expected, there is no point in logging
	//        them, at least if the error is
	//        "Error [ERR_STREAM_WRITE_AFTER_END]: write after end"
	socket.on('error',e=>console.log("client socket error: " + e));
	sockets.push(socket);
	try {  // load motd file
		var motd = require("fs").readFileSync('motd.txt');
		sendData(socket, motd);
	} catch {
		// no motd available; generic welcome
		sendData(socket, chalk.green('Welcome to the ')
			+ chalk.bold.white(talkername) + chalk.green("!"));
	}
	sendData(socket,chalk.cyan('\r\n\r\nGive me a name:  '));
	socket.on('data', function(data) {
		receiveData(socket, data);
	})
	socket.on('end', function() {
		closeSocket(socket);
	})
}


/*
 * COMMAND UTILITY  -  Should probably be moved to own module
 * Object passed to commands.  Gives them access to specific server properties, methods
 */

//
function command_utility() {
	return {
		version: version,
		talkername: talkername,
		sockets: sockets,
		commands: commands,
		ranks: ranks,
		echo: echo,
		getDateTimeString: getDateTimeString,
		loadCommands: loadCommands,
		getCmdRank: getCmdRank,
		setCmdRank: setCmdRank,
		findCommand: findCommand,
		sendData: sendData,
		saveTotalTime: saveTotalTime,

		/*
		 * Execute function to all connected users *but* the triggering
		 * one.
		 * It stops at the first connected user to which the function
		 * returns true, returning true.
		 */
		allButMe: function allButMe(socket,fn) {
			for(var i = 0; i<sockets.length; i++) {
				if (sockets[i] !== socket) {
					if ((typeof sockets[i].loggedin != 'undefined') &&
						sockets[i].loggedin &&
						(sockets[i].readyState === 'open')
					){
						if(fn(socket,sockets[i])) return true;
					}
				}
			}
		},

		// same as allButMe, but only for those in the same room as me
		allHereButMe: function allHereButMe(socket,fn) {
			for(var i = 0 ; i < sockets.length; i++) {
				if (sockets[i] !== socket) {
					if ((typeof sockets[i].loggedin != 'undefined') &&
						sockets[i].loggedin &&
						(sockets[i].readyState === 'open') &&
						(sockets[i].db.where[0] == socket.db.where[0]) &&
						(sockets[i].db.where[1] == socket.db.where[1]) &&
						(sockets[i].db.where[2] == socket.db.where[2])
					){
						if(fn(socket,sockets[i])) return true;
					}
				}
			}
		},

	    // returns socket for the user, or false if he doesn't exist
	    getOnlineUser: function getOnlineUser(name) {
	    	for (var i = 0; i < sockets.length; i++) {
	    		if (name.toLowerCase() === sockets[i].username.toLowerCase() && sockets[i].loggedin) return sockets[i];
	    	}
	    	return false;
	    },

	    // returns array of sockets of the 'approximate' online users
	    // While 'getOnlineUser' is the correct function to use if you want
	    // to know if 'username' is online or not, sometimes users want to
	    // refer to another user in an 'human' way, abbreviating.
	    // Eg.: .wizlist tries to find if each wiz is online or not. Since
	    // the username is fully and correctly known, 'getOnlineUser' should be
	    // used. On the other hand, .tell gets an username as an argument. On
	    // that case, an user can type '.tell mr hello', meaning '.tell MrMe
	    // hello'. On that case, 'getAproxOnlineUser' should be used.
	    getAproxOnlineUser: function getOnlineUser(name) {
		if (this.getOnlineUser(name) !== false) return [this.getOnlineUser(name)];
		var possibilities = [];
		for (var i = 0; i < sockets.length; i++) {
		    if (name.toLowerCase() === sockets[i].username.toLowerCase().substr(0,name.length) && sockets[i].loggedin && (name.length < sockets[i].username.length))
			possibilities.push(sockets[i]);
		}
		return possibilities;
	    },

        // returns the user object, in all its db glory
        // TODO: Let's give just a subset of data from the user, OK? I mean, we
        // don't want any command to have access to other users' passwords, do
        // we?
        getUser: function getUser(name) {
            name = name.toLowerCase().charAt(0).toUpperCase() + name.toLowerCase().slice(1);
            return usersdb.get(name).value();
        },

	// returns the username of an "aproximate" user
	// read 'getAproxOnlineUser' to understand the difference between
	// 'getOnlineUser' and it, same happens here between 'getUser' and
	// 'getAproxUser'.
	getAproxUser: function getAproxUser(name) {
		if (this.getUser(name) !== undefined) return [name];
		var possibilities = [];
		for (var key in usersdb.getState()) {
		    if (name.toLowerCase() === key.toLowerCase().substr(0,name.length) && (name.length < key.length)) {
			    possibilities.push(key);
		    }
		}
		if (possibilities.length === 0) return [];
		return possibilities;
	},

	// updates a user in the database
	// TODO: argh, we surely don't want this! harden it!
	updateUser: function updateUser(username, userObj) {
		username = username.toLowerCase().charAt(0).toUpperCase() + username.toLowerCase().slice(1);
		usersdb.set(username,userObj).write();
	},

	// get users list, only insensitive information
	getUsersList: function getUsersList() {
		var list = [];
		for (var key in usersdb.getState()) {
			// retrieving username, rank and loginTime. If needed, we can always add stuff later
			var val = usersdb.get(key).value();
			list.push({username:key, rank:val.rank, loginTime:val.loginTime});
		}
		return list;
	},

		// gives a full view of the universe; TODO: we surely don't want this
		// TODO: in the meantime, we don't need to define a function for this!
		getUniverse: function getUniverse() {return universe; },
		// update universe's database
		saveUniverse: function setUniverse() {
			return universedb.set("universe", universe).write();
		},

		// updates the ranks object, both in memory and on the database
		updateRanks: function updateRanks(updated) {
			ranks = updated;
			return talkerdb.set("ranks", ranks).write();
		},

		// reloads Talker Name
		reloadTalkerName: function reloadTalkerName() {
			talkername = universe.name;
		},

    };
};

/*
 * PROMPT UTILITY - adds a command prompt to the server.
 * Implemented commands:
 *     rc: Reload commands. Useful for development/debug. Allows
 *         you to reload the commands on the fly!
 */
function setPrompt() {
	var readline = require('readline');
	var rl = readline.createInterface({
	  input: process.stdin,
	  output: process.stdout,
	  prompt: 'OHAI> '
	});

	rl.prompt();

	rl.on('line', function(line) {
	  switch(line.trim()) {
	    case 'rc':
	      try {
	        console.log(loadCommands());
	      } catch (e) {
	        console.log(e);
	      }
	      break;
	    default:
	      console.log("Available commands: ");
	      console.log("    rc: Reload commands. Useful for development/debug. Allows");
	      console.log("            you to reload the commands on the fly!");
	      break;
	  }
	  rl.prompt();
	}).on('close', function() {
	  console.log('Bye!');
	  process.exit(0);
	});
}

/*
* Housekeeping function invoked periodically by watchdog feature
*/
function doHousekeeping() {
	// All routine housekeeping calls should be added here
	saveTotalTime();
}

/*
 * AND FINALLY... THE ACTUAL main()!
 */

function main() {
	if (loadeddb !== 3) {
		console.log("Waiting for databases to load: " + loadeddb + "/3");
		setTimeout(main, 100);
	} else {
		// Create a new server and provide a callback for when a connection occurs
		var server = net.createServer(newSocket);

		// Listen on defined port
		server.listen(port);
		server.on('error',e=>console.log("server socket error: " + e));
		console.log(talkername + " initialized on port "+ port);
		console.log(loadCommands());
		if(talkerdb.get("watchdog").value() > 0) {
			console.log("Unleashing watchdog for housekeeping each " + talkerdb.get("watchdog").value() + " seconds");
			setInterval(doHousekeeping, (talkerdb.get("watchdog").value()*1000));
		}

		setPrompt();
	}
}

main();
