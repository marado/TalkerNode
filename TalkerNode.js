// https://github.com/marado/TalkerNode

"use strict";
var net = require('net');
var crypto = require('crypto');

var sockets = [];
var port = process.env.PORT || 8888;
var talkername = "Moosville";
var version = "0.1.2";

// Instanciates the users database
var dirty = require('dirty');
var usersdb = dirty('user.db');
usersdb.on('error', function(err) { console.log("USERS DB ERROR! "+err); });

/*
 * Cleans the input of carriage return, newline and control characters
 */
function cleanInput(data) {
	var newString = data.toString().replace("[\u0000-\u001a]", "").replace("[\u001c-\u001f]", "").replace(/(\r\n|\n|\r)/gm,"").replace(/\u001b\[./gm,"");
	while (newString.charAt(0) === " ") newString=newString.substring(1);
	return newString;
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
		36  // Telnet IAC - Environment Variables
	];
	if (IAC.indexOf(cleanData.charCodeAt(0)) !== -1) {
		// This is IAC, not an user input
		console.log("Moo: IAC: [" + cleanData.charCodeAt(0) +"]");
		return;
	}

	if(socket.username == undefined) {
		if (cleanData.toLowerCase() === "quit") return socket.end('Goodbye!\n');
		if (cleanData.toLowerCase() === "who") { who(socket); return socket.write("Give me a name:  "); }
		if (cleanData.toLowerCase() === "version") { show_version(socket); return socket.write("Give me a name:  "); }
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
				socket.registering=true;
			} else {
				socket.write("\r\nGive me your password: ");
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
				socket.password = crypto.createHash('sha512').update(cleanData).digest('hex');
				socket.write("\r\nConfirm the chosen password: ");
				return;
			} else {
				if (socket.password === crypto.createHash('sha512').update(cleanData).digest('hex')) {
					// password confirmed
					socket.db={"password":crypto.createHash('sha512').update(cleanData).digest('hex')};
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

		// entering the talker
		if (allButMe(socket,function(me,to){if(to.username.toLowerCase()===me.username.toLowerCase()){return true;}})) {
			var old = allButMe(socket,function(me,to){if(to.username.toLowerCase()===me.username.toLowerCase()){to.end('Session is being taken over...\n');}});
			socket.write('Taking over session...\n');
		} else {
			allButMe(socket,function(me,to){to.write("[Entering is: "+ me.username + " ]\r\n");});
		}
		socket.write("\r\nWelcome " + socket.username + "\r\n");
		socket.loggedin = true;
		return;
	} else if (typeof socket.interactive !== 'undefined') {
		switch (socket.interactive.type) {
			case "password":
				socket.db = usersdb.get(socket.username);
				if (socket.interactive.state === "old") {
					// let's confirm the password
					if (socket.db.password !== crypto.createHash('sha512').update(cleanData).digest('hex')) {
						 socket.write("\r\n:: Wrong password!\r\n");
						delete socket.interactive;
					} else {
						// password is correct
						socket.write("\r\n:: Tell me the new password: ");
						socket.interactive.state = "new";
					}
				} else {
					// let's set cleanData as the new password
					socket.db.password = crypto.createHash('sha512').update(cleanData).digest('hex');
					usersdb.set(socket.username, socket.db);
					socket.write("\r\n:: Password changed, now don't you forget your new password!\r\n");
					delete socket.interactive;
				}
				delete socket.db;
				break;
			default:
				socket.write("\r\n:: Something really weird just happened... let's try to recover from it...\r\n");
				delete socket.interactive;
				break;
		}
		return;
	}

	// if we have a command...
	if (cleanData.charAt(0) === ".") {
		doCommand(socket, cleanData);
	} else {
		doCommand(socket, ".say " + cleanData);
	}
		
}

/*
 * Method for commands. In future this should be elsewhere, but for now we must start already separating this from the rest...
 */
function doCommand(socket, command) {
	switch(command.split(' ')[0].toLowerCase()) {
		case ".e":
		case ".em":
		case ".emo":
		case ".emot":
		case ".emote":
			var send = socket.username + " " + command.split(' ').slice(1).join(" ") + "\r\n";
			allButMe(socket,function(me,to){to.write(send);}); 
			socket.write(send);
			break;
		case ".h":
		case ".he":
		case ".hel":
		case ".help":
			help(socket);
			break;	
		case ".p":
		case ".pa":
		case ".pas":
		case ".pass":
		case ".passw":
		case ".passwd":
		case ".passwo":
		case ".passwor":
		case ".password":
			password(socket);
			break;
		case ".q":
		case ".qu":
		case ".qui":
		case ".quit":
			allButMe(socket,function(me,to){to.write("[Leaving is: "+ me.username + " ]\r\n");});
			socket.end('Goodbye!\n');
			break;
		case ".s":
		case ".sa":
		case ".say":
			allButMe(socket,function(me,to){to.write(me.username + ": " + command.split(' ').slice(1).join(" ") + "\r\n");});
			socket.write("You said: " + command.split(' ').slice(1).join(" ") + "\r\n");
			break;
		case ".t":
		case ".te":
		case ".tel":
		case ".tell": 
			tell(socket, command.split(' ')[1], command.split(' ').slice(2).join(" "));
			break;
		case ".v":
		case ".ve":
		case ".ver":
		case ".vers":
		case ".versi":
		case ".versio":
		case ".version":
			show_version(socket);
			break;	
		case ".w":
		case ".wh":
		case ".who":
			who(socket);
			break;
		default:
			socket.write("There's no such thing as a " + command.split(' ')[0] + " command.\r\n");
			break;
	}
}

/*
 * Method executed when a socket ends
 */
function closeSocket(socket) {
	var i = sockets.indexOf(socket);
	if (i != -1) {
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
 * Execute function to all connected users *but* the triggering one. 
 * It stops at the first connected user to which the function returns true, returning true.
 */
function allButMe(socket,fn) {
	for(var i = 0; i<sockets.length; i++) {
		if (sockets[i] !== socket) {
			if ((typeof sockets[i].loggedin != 'undefined') && sockets[i].loggedin){
				if(fn(socket,sockets[i])) return true;
			}
		}
	}
}


/*
 * COMMANDS!
 */

function who(socket) {
	var connected = 0;
	var connecting = 0;
	socket.write("+----------------------------------------------------------------------------+\r\n");
	socket.write("   Current users on " + talkername + " at " + new Date().toLocaleDateString() +", " + new Date().toLocaleTimeString() +"\r\n");
	socket.write("+----------------------------------------------------------------------------+\r\n");
	socket.write("  Name              Server              Family\tClient    \r\n");
	socket.write("+----------------------------------------------------------------------------+\r\n");
	for (var i = 0; i < sockets.length; i++) {
		if ((typeof sockets[i].loggedin === 'undefined') || !sockets[i].loggedin ){
			connecting++;
		} else {
			connected++;
			var name = sockets[i].username; for (var pad = sockets[i].username.length; pad < 16; pad++) name+=" ";
			socket.write("  " + name + "  " + sockets[i].server.address().address + ":" + sockets[i].server.address().port + "\t" + sockets[i].server.address().family + "\t" + sockets[i].remoteAddress + ":" + sockets[i].remotePort + "\r\n");
		}
	}
	socket.write("+----------------------------------------------------------------------------+\r\n");
	socket.write("     Total of " + connected + " connected users"); if (connecting > 0) { socket.write(" and " + connecting + " still connecting"); }
	socket.write("\r\n+----------------------------------------------------------------------------+\r\n");

}

function help(socket) {
	socket.write("+-----------------------------------------------------------------------------+\r\n");
	socket.write("   Helpful commands on " + talkername + "\r\n");
	socket.write("+-----------------------------------------------------------------------------+\r\n");
	socket.write("| .help     - shows you this list of commands and what do they do             |\r\n");
	socket.write("| .say      - lets you talk with other people. Just .say something!           |\r\n");
	socket.write("| .emote    - lets you pose something, as if you were acting.                 |\r\n");
	socket.write("| .quit     - leaving us, are you? Then .quit !                               |\r\n");
	socket.write("| .who      - lets you know who is connected in the talker at this moment     |\r\n");
	socket.write("| .version  - gives you information regarding the software this talker runs   |\r\n");
	socket.write("| .tell     - tells someone something, in private. Only both of you will know |\r\n");
	socket.write("| .password - use this if you want to change your password                    |\r\n");
	socket.write("+-----------------------------------------------------------------------------+\r\n");
	socket.write("| Remember: all commands start with a dot (.), like .help                     |\r\n");
	socket.write("+-----------------------------------------------------------------------------+\r\n");
}

function show_version(socket) {
	socket.write("+------------------------------------+\r\n TalkerNode, version " + version + "\r\n https://github.com/marado/TalkerNode\r\n+------------------------------------+\r\n");
}

function password(from) {
	from.write(":: Tell me your old password: ");
	from.interactive = {type:"password", state:"old"};
}

function tell(from, to, message) {
	if ((typeof to === 'undefined') || (typeof message === 'undefined') || to.length < 1 || message.length < 1) {
		from.write(":: You have to use it this way: .tell someone something\r\n");
	} else if (from.username.toLowerCase() === to.toLowerCase()) {
		from.write(":: Talking to yourself is the first sign of madness.\r\n");
	} else {
		var s = getOnlineUser(to);
		if (s) {
			from.write("You tell " + to + ": " + message + "\r\n");
			s.write(from.username + " tells you: " + message + "\r\n");
		} else {
			from.write("There is no one of that name logged on.\r\n");
		}
	}
}

// returns socket for the user, or false if he doesn't exist
function getOnlineUser(name) {
		for (var i = 0; i < sockets.length; i++) {
			if (name.toLowerCase() === sockets[i].username.toLowerCase() && sockets[i].loggedin) return sockets[i];
		}
		return false;
}

/* 
 * AND FINALLY... THE ACTUAL main()!
 */

// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen on defined port
server.listen(port);
console.log(talkername + " initialized on port "+ port);
