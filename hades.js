// https://dl.dropboxusercontent.com/u/133374/hades.txt
// downloaded at 11/11/2013
// coded by sam@hades
// hades: telnet hades-talker.org 6660

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

        console.log("Moo [" + cleanData + "]");

		// TODO: We're just filtering out IAC commands. We should be dealing with them instead...
		// IAC commands
		var IAC = [
			1 , // Telnet IAC - Echo
			3 , // Telnet IAC - Suppress Go Ahead
			5 , // Telnet IAC - Status                
			6 , // Telnet IAC - Timing Mark
			24, // Telnet IAC - Terminal Type
			31, // Telnet IAC - Window Size
			32, // Telnet IAC - Window Speed
			33, // Telnet IAC - Remote Flow Control
			34, // Telnet IAC - Linemode
			36  // Telnet IAC - Environment Variables
		];
		if (IAC.indexOf(cleanData.charCodeAt(0)) !== -1) {
			// This is IAC, not an user input
			console.log("Moo: IAC: [" + cleanData.charCodeAt(0) +"]");
		    return;
		}

        if(socket.username == undefined)
        {
                socket.username = cleanData;
                socket.write("\r\n\r\nWelcome " + socket.username + "\r\n");
				return;
        }


        if(cleanData === ".quit") {
                socket.end('Goodbye!\n');
        }
        else {
                for(var i = 0; i<sockets.length; i++) {
                        if (sockets[i] !== socket) {
                                sockets[i].write(socket.username + ": " + data);
                        }
                }
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

// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen on defined port
server.listen(port);
