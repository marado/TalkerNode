// https://github.com/marado/TalkerNode

"use strict";
var net = require('net');
var crypto = require('crypto');
var valid = require('password-strength');

var sockets = [];
var port = process.env.PORT || 8888; // TODO: move to talker settings database
var talkername = "Moosville";        // TODO: move to the talker settings database
var version = "0.2.10";

// Instantiates the users database
var dirty = require('dirty');
var usersdb = dirty('user.db');
usersdb.on('error', function(err) { console.log("USERS DB ERROR! "+err); });

// Instantiates the talker settings database
var ranks;
var commands = {};
var talkerdb = dirty('talker.db').on('load', function() {
    talkerdb.on('error', function(err) { console.log("TALKER DB ERROR! "+err); });
    ranks = talkerdb.get("ranks");
    if (typeof ranks === 'undefined') {
        ranks = {list:["Jailed", "Newcomer", "Newbie", "Juvie", "Learner", "Adult", "Wiseman", "Hero", "Mage", "Imortal", "God"], entrylevel: 10};
        talkerdb.set("ranks", ranks);
    }
});

// Instantiates the universe
var nodiverse = require('nodiverse');
var universe;
var universedb = dirty('universe.db').on('load', function() {
    universedb.on('error', function(err) { console.log("UNIVERSE DB ERROR! "+err); });
    universe = universedb.get("universe");
    if (typeof universe === 'undefined') {
        universe = nodiverse(); // new universe
        universe.create([0,0,0],0);
        var limbo = universe.get([0,0,0]);
        limbo.name = "Limbo"; // at the beginning there was just the limbo
        universe.update(limbo);
        universe.entrypoint=[0,0,0]; // where everyone was meant to be
        universedb.set("universe", universe);
    } else {
		// assign the correct prototype to universe
		// this is somewhat ugly, since we're falling back from Object.?etPrototypeOf to __proto__ in order not to depend on nodejs 0.12
		var setProtoOf = function(obj, proto) { obj.__proto__ = proto; };
		var mixinProperties = function(obj, proto) { for (var prop in proto) { obj[prop] = proto[prop]; } };
		var setPrototypeOf = Object.setPrototypeOf || {__proto__:[]} instanceof Array ? setProtoOf : mixinProperties;
		var getPrototypeOf = Object.getPrototypeOf || function(obj) { return obj.__proto__; };
		setPrototypeOf(universe, getPrototypeOf(nodiverse()));
	}
});

// TODO: we should only start the talker when all databases are loaded

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
    return new Buffer(bytes);
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

	socket.write(echo(true));
	if(socket.username == undefined) {
		if (cleanData.toLowerCase() === "quit") return socket.end('Goodbye!\r\n');
		if (cleanData.toLowerCase() === "who") { socket.db={rank:0}; doCommand(socket, ".who"); return socket.write("Give me a name:  "); }
		if (cleanData.toLowerCase() === "version") { socket.db={rank:0}; doCommand(socket, ".version"); return socket.write("Give me a name:  "); }
		var reservedNames=["who","quit","version"];
		if (reservedNames.indexOf(cleanData.toLowerCase()) > -1) {
			socket.write("\r\nThat username is reserved, you cannot have it.\r\nGive me a name:  ");
		}
		else if ((cleanData.match(/^[a-zA-Z]+$/) !== null) && (1 < cleanData.length) && (cleanData.length < 17)) {
			socket.username = cleanData.toLowerCase().charAt(0).toUpperCase() + cleanData.toLowerCase().slice(1); // Capitalized name
			socket.loggedin = false;
			socket.db = usersdb.get(socket.username);
			if (typeof socket.db === 'undefined') {
				socket.write("\r\nNew user, welcome! Please choose a password: ");
				socket.write(echo(false));
				socket.registering=true;
			} else {
				socket.write("\r\nGive me your password: ");
				socket.write(echo(false));
				socket.registering=false;
			}
			return;
		} else {
			socket.write("\r\nInvalid username: it can only contain letters, have at least two characters and be no longer than 16 characters.\r\nGive me a name:  ");
		}
		return;
	} else if (socket.loggedin == false) {
		// this is the password
		if (socket.registering) {
			if (typeof socket.password === 'undefined') {
				if ((cleanData.toLowerCase() === socket.username.toLowerCase()) || !valid(cleanData).valid) {
				    socket.write("\r\nThat password is not valid");
				    if (valid(cleanData).hint !== null) socket.write(" (" + valid(cleanData).hint + ")");
				    socket.write(". Let's try again...\r\nGive me a name: ");
				    delete socket.registering;
				    delete socket.username;
				    delete socket.loggedin;
				    delete socket.db;
				    return;
				}
				socket.password = crypto.createHash('sha512').update(cleanData).digest('hex');
				socket.write(echo(false));
				socket.write("\r\nConfirm the chosen password: ");
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
						talkerdb.set("ranks", ranks);
					}
					usersdb.set(socket.username, socket.db);
					delete socket.password;
					delete socket.registering;
				} else {
					// wrong confirmation password
					delete socket.password;
					delete socket.registering;
					delete socket.username;
					delete socket.db;
					socket.write("\r\nPasswords don't match! Let's start from the beggining... Tell me your name:  ");
					return;
				}
			}
		} else if (socket.db.password !== crypto.createHash('sha512').update(cleanData).digest('hex')) {
			delete socket.username;
			delete socket.db;
			socket.write("\r\nWrong password! Let's start from the beggining... Tell me your name:  ");
			return;
		}

		// entering the talker...
		if (universe.get(socket.db.where) === null) { // there's no where, or that place doesn't exist anymore
			socket.db.where = universe.entrypoint;
			// save changes into the database
			var tmp = usersdb.get(socket.username);
			tmp.where = socket.db.where;
			usersdb.set(socket.username, tmp);
		}
		if (command_utility().allButMe(socket,function(me,to){if(to.username.toLowerCase()===me.username.toLowerCase()){return true;}})) {
			var old = command_utility().allButMe(socket,function(me,to){if(to.username.toLowerCase()===me.username.toLowerCase()){to.end('Session is being taken over...\n');}});
			socket.write('Taking over session...\n');
		} else {
			socket.loginTime = Date.now();
			socket.activityTime = Date.now();
			command_utility().allButMe(socket,function(me,to){to.write("[Entering is: "+ me.username + " (" + universe.get(me.db.where).name + " " + me.db.where + ") ]\r\n");});
		}
		socket.write("\r\nWelcome " + socket.username + "\r\n");
		socket.loggedin = true;
		return;
	} else if (typeof socket.interactive !== 'undefined') {
		switch (socket.interactive.type) {
			case "password":
				if (socket.interactive.state === "old") {
					// let's confirm the password
					if (socket.db.password !== crypto.createHash('sha512').update(cleanData).digest('hex')) {
						 socket.write("\r\n:: Wrong password!\r\n");
						delete socket.interactive;
					} else {
						// password is correct
						socket.write("\r\n:: Tell me the new password: ");
						socket.write(echo(false));
						socket.interactive.state = "new";
					}
				} else {
					// let's set cleanData as the new password
					if ((cleanData.toLowerCase() === socket.username.toLowerCase()) || !valid(cleanData).valid) {
					    socket.write("\r\nThat password is not valid");
					    if (valid(cleanData).hint !== null) socket.write(" (" + valid(cleanData).hint + ")");
					    socket.write(". Password not changed.\r\n");
					    delete socket.interactive;
					    return;
					}
					socket.db.password = crypto.createHash('sha512').update(cleanData).digest('hex');
					usersdb.set(socket.username, socket.db);
					socket.write("\r\n:: Password changed, now don't you forget your new password!\r\n");
					delete socket.interactive;
				}
				break;
			default:
				socket.write("\r\n:: Something really weird just happened... let's try to recover from it...\r\n");
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
	require("fs").readdirSync(normalizedPath).forEach(function(file) {
		if (file.substr(file.length-3, 3) === ".js") {
			delete require.cache[require.resolve('./commands/' + file)]
			var cmd_load = require('./commands/' + file);
			var cmd = cmd_load.command;

			// Only load the command if it's set to Autoload
			if(cmd.autoload) {
				console.log("Loading Command: Command '" + cmd.name + "' loaded (from '" + file + "')");
				cmd.loaded_date = new Date();
				commands[cmd.name] = cmd;
			} else {
				console.log("Loading Command: Skipping " + cmd.name + " (from '" + file + "'). Autoload = false");
			}
		} else {
			console.log("Skipping " + file + ": file extension is not 'js'");
		}
	});
}


/*
 * Method for commands. In future this should be elsewhere, but for now we must
 * start already separating this from the rest...
 */
function doCommand(socket, command) {
	socket.activityTime = Date.now();
	try {
		var c = command.split(' ')[0].toLowerCase().substring(1);
		var userRank = socket.db.rank;
		if(commands[c] && userRank >= commands[c].min_rank) {
			socket.lastcommand = command;
			commands[c].execute(socket, command.split(' ').slice(1).join(" "), command_utility())
		} else {
			// when we have more than one possible command, we
			// choose the most heavier from the one with lower
			// min_rank
			var results = [];
			var weigth = 0;
			var rank = ranks.entrylevel;
			for (var cmd in commands) {
				if(cmd.substr(0, c.length) == c && userRank >= commands[cmd].min_rank) {
					var cweigth = 0;
					var crank = ranks.entrylevel;
					if (typeof commands[cmd].weigth !== 'undefined')
						cweigth = commands[cmd].weigth;
					if (commands[cmd].min_rank < rank) {
						rank = rank.entrylevel;
						weigth = cweigth;
						results = [cmd];
					} else if (commands[cmd].min_rank === crank) {
						if (cweigth > weigth) {
							weigth = commands[cmd].weigth;
							results = [cmd];
						} else if (cweigth === weigth) {
							results.push(cmd);
						}
					}
				}
			}
			if(results.length == 1) {
				var x = commands[results[0]];
				socket.lastcommand = command;
				x.execute(socket, command.split(' ').slice(1).join(" "), command_utility());
			} else if(results.length > 1) {
				socket.write("Found " + results.length + " possible commands (" + results.toString().replace(/,/g,", ") + "). Please be more specific.\r\n");
			} else {
				socket.write("There's no such thing as a " + c + " command.\r\n");
			}
		}
	}
	catch(err) {
		socket.write("Error executing command '" + c + "': " + err + "\r\n");
		console.error("Error executing command '" + c + "': " + err + "\r\n");
	}
}

/*
 * Method executed when a socket ends
 */
function closeSocket(socket) {
	var i = sockets.indexOf(socket);
	if (i != -1) {
		// write total time on socket db
		sockets[i].db = usersdb.get(sockets[i].username);
		if (typeof sockets[i].db !== 'undefined') {
		    if (typeof sockets[i].db.totalTime === 'undefined') {
			sockets[i].db.totalTime = (Date.now() - sockets[i].loginTime);
		    } else {
			sockets[i].db.totalTime += (Date.now() - sockets[i].loginTime);
		    }
		    usersdb.set(sockets[i].username, sockets[i].db);
		}
		sockets.splice(i, 1);
	}
}

/*
 * Callback method executed when a new TCP socket is opened.
 */
function newSocket(socket) {
	sockets.push(socket);
	socket.write('Welcome to the '+talkername+'!\r\n\r\nGive me a name:  ');
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
    var ret = {
	    version: version,
	    talkername: talkername,
	    sockets: sockets,
	    commands: commands,
	    ranks: ranks,
	    echo: echo,
	    
	    /*
	     * Execute function to all connected users *but* the triggering one. 
	     * It stops at the first connected user to which the function returns true, returning true.
	     */
	    allButMe: function allButMe(socket,fn) {
	    	for(var i = 0; i<sockets.length; i++) {
	    		if (sockets[i] !== socket) {
	    			if ((typeof sockets[i].loggedin != 'undefined') && sockets[i].loggedin){
	    				if(fn(socket,sockets[i])) return true;
	    			}
	    		}
	    	}
	    },

		// same as allButMe, but only for those in the same room as me
		allHereButMe: function allHereButMe(socket,fn) {
			for(var i = 0 ; i < sockets.length; i++) {
				if (sockets[i] !== socket) {
	    			if ((typeof sockets[i].loggedin != 'undefined') && sockets[i].loggedin && 
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

        // returns the user object, in all its db glory
        // TODO: Let's give just a subset of data from the user, OK? I mean, we
        // don't want any command to have access to other users' passwords, do
        // we?
        getUser: function getUser(name) {
            name = name.toLowerCase().charAt(0).toUpperCase() + name.toLowerCase().slice(1);
            return usersdb.get(name);
        },

        // updates a user in the database
        // TODO: argh, we surely don't want this! harden it!
        updateUser: function updateUser(username, userObj) {
            username = username.toLowerCase().charAt(0).toUpperCase() + username.toLowerCase().slice(1);
            usersdb.set(username,userObj);
        },

		// get users list, only insensitive information
		getUsersList: function getUsersList() {
			var list = [];
		    usersdb.forEach(function(key, val) {
				// retrieving username and rank. If needed, we can allways add stuff later
				list.push({username:key, rank:val.rank});
			});
			return list;
		},

		// gives a full view of the universe; TODO: we surely don't want this
		getUniverse: function getUniverse() {return universe; },

    };
    return ret;
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
	      loadCommands();
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
 * AND FINALLY... THE ACTUAL main()!
 */

// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen on defined port
server.listen(port);
console.log(talkername + " initialized on port "+ port);
loadCommands();
setPrompt();

