// https://github.com/marado/TalkerNode

"use strict";
var net = require('net');

var sockets = [];

var port = process.env.PORT || 8888;

var talkername = "Moosville";

/*
 * Cleans the input of carriage return, newline and control characters
 */
function cleanInput(data) {
	var newString = data.toString().replace("[\u0000-\u001f]", "");
	return newString.replace(/(\r\n|\n|\r)/gm,"");
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
		32, // Telnet IAC - Window Speed /* FIXME or a space! remember, this is cleanData! */
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
		// TODO: implement quit on login screen 
		// TODO: implement who on login screen 
		// TODO: implement version on login screen 
		var reservedNames=["who","quit","version"];
		if (reservedNames.indexOf(cleanData.toLowerCase()) > -1) {
			socket.write("\r\nThat username is reserved, you cannot have it.\r\nGive me a name:  ");
		}
		// TODO: check if the username is already in use
		else if ((cleanData.match(/^[a-zA-Z]+$/) !== null) && (1 < cleanData.length) && (cleanData.length < 17)) {
			socket.username = cleanData.toLowerCase().charAt(0).toUpperCase() + cleanData.toLowerCase().slice(1); // Capitalized name
			allButMe(socket,function(me,to){to.write("[Entering is: "+ me.username + " ]\r\n");});
			socket.write("\r\nWelcome " + socket.username + "\r\n");
		} else {
			socket.write("\r\nInvalid username: it can only contain letters, have at least two characters and be no longer than 16 characters.\r\nGive me a name:  ");
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
	switch(command.split(' ')[0]) {
		case ".quit":
			socket.end('Goodbye!\n');
			break;
		case ".say":
			allButMe(socket,function(me,to){to.write(me.username + ": " + command.split(' ').slice(1).join(" ") + "\r\n");});
			socket.write("You said: " + command.split(' ').slice(1).join(" ") + "\r\n");
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
 * Execute function to all connected users *but* the triggering one
 */
function allButMe(socket,fn) {
	for(var i = 0; i<sockets.length; i++) {
		if (sockets[i] !== socket) {
			if (typeof sockets[i].username != 'undefined') fn(socket,sockets[i]);
		}
	}
}

// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen on defined port
server.listen(port);
console.log(talkername + " initialized on port "+ port);
