exports.command = {
	name: "desc",
	autoload: true,
	unloadable: false,
	min_rank: 1,
	display: "sets up your description",
	help: "Sets up a description sentence that will be visible on .who",
	usage: ".desc <description>",


	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		descMaxLength = 18; // this limit is being currently imposed due to .who's presentation layer

		if ((typeof command === 'undefined') || command.length < 1) {
			command_access.sendData(socket, chalk.yellow("[::] ") + "You have to use it this way: .desc <description here> ~RS\r\n");
		} else if (command_access.monotone(command).length > descMaxLength) {
			command_access.sendData(socket, chalk.yellow("[::] ") + "Your description can't have more than " + chalk.bold(descMaxLength) + " characters. ~RS\r\n");
		} else {
			socket.db.desc = command_access.colorize(command);
			command_access.updateUser(socket.username, socket.db);
			command_access.sendData(socket, chalk.green("[::] ") + " Your description is now: " + command + " ~RS\r\n");
		}
	}
}
