exports.command = {
	name: "color",
	autoload: true,
	unloadable: false,
	min_rank: 1,
	display: "toggle colors on or off, for you",
	help: "Toggles colors on or off, for you",
	usage: ".color",


	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (typeof socket.db.color === 'undefined') {
			// By default color is turned on, so we're now turning it off:
			socket.db.color = false;
		} else {
			socket.db.color = !(socket.db.color);
		}
		command_access.updateUser(socket.username, socket.db);
		command_access.sendData(socket, chalk.green("[::] ") + "You have the color setting: " + socket.db.color + "\r\n");
	}
}
