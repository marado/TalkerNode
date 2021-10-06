exports.command = {
	name: "save",
	autoload: true,
	unloadable: false,
	min_rank: 7,
	display: "Saves total time for all users",
	help: "Saves total time for all users",
	usage: ".save",
	weight: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.saveTotalTime();
		command_access.sendData(socket,
			chalk.green(":: Total time for all users has been saved.\r\n")
		);
	}
}
