exports.command = {
	name: "tell", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "tells someone something, in private.",
	help: "Tells someone something, in private. Only both of you will know...",
	usage: ".tell <user> <text>",

	execute: function(socket, command, command_access) {

		var chalk = require('chalk');
		to = command.split(' ')[0];
		message = command.split(' ').slice(1).join(" ");

		if ((typeof to === 'undefined') || (typeof message === 'undefined') || to.length < 1 || message.length < 1) {
			socket.write(chalk.yellow(":: ") + "You have to use it this way:" + chalk.yellow(" .tell someone something\r\n"));
		} else {
			var s = command_access.getAproxOnlineUser(to);
			if (s.length === 1) {
				if (socket.username.toLowerCase() === s[0].username.toLowerCase()) {
					return socket.write(chalk.red(":: ") + "Talking to yourself is the first sign of madness.\r\n");
				}
				socket.write(chalk.green("You tell ") + s[0].username + chalk.green(": ") + message + "\r\n");
				s[0].write(socket.username + chalk.green(" tells you: ") + message + "\r\n");
			} else if (s.length === 0) {
				socket.write(chalk.red(":: ") + "There is no one of that name logged on.\r\n");
			} else {
				var possibilities = "";
				for (var p = 0; p < s.length - 1; p++) {
					possibilities += chalk.bold(s[p].username) + ", ";
				}
				possibilities += chalk.bold(s[s.length - 1].username);
				socket.write(chalk.yellow(":: ") + "Be more explicit: whom do you want to talk to ("+possibilities+")?\r\n");
			}
		}
	}
}
