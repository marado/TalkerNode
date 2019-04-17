exports.command = {
	name: "tell", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "tells someone something, in private.",
	help: "Tells someone something, in private. Only both of you will know...",
	usage: ".tell <user> <text>",

	execute: function(socket, command, command_access) {

		var colorize = require('colorize');
		to = command.split(' ')[0];
		message = command.split(' ').slice(1).join(" ");

		if ((typeof to === 'undefined') || (typeof message === 'undefined') || to.length < 1 || message.length < 1) {
			socket.write(":: You have to use it this way: .tell someone something\r\n");
		} else {
			var s = command_access.getAproxOnlineUser(to);
			if (s.length === 1) {
				if (socket.username.toLowerCase() === s[0].username.toLowerCase()) {
					return socket.write(":: Talking to yourself is the first sign of madness.\r\n");
				}
				socket.write("You tell " + s[0].username + ": " + message + "\r\n");
				s[0].write(socket.username + " tells you: " + message + "\r\n");
			} else if (s.length === 0) {
				socket.write("There is no one of that name logged on.\r\n");
			} else {
				var possibilities = "";
				for (var p = 0; p < s.length - 1; p++) {
					possibilities += s[p].username + ", ";
				}
				possibilities += s[s.length - 1].username;
				socket.write("Be more explicit: whom do you want to talk to ("+possibilities+")?\r\n");
			}
		}
	}
}
