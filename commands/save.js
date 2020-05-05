exports.command = {
	name: "save", 								// Name of command to be executed (Max 10 chars)
	autoload: true,								// Should the command be autoloaded at startup
	unloadable: false,							// Can the command be unloaded dynamically
	min_rank: 7,								// Minimum rank to use to execute the command
	display: "Saves total time for all users",	// Summary help text to show in the .help command (Max 60 chars)
	help: "Saves total time for all users",		// Full help text when .help <command> is used
	usage: ".save",								// usage of the command
	weigth: 0,									// if two commands are elegible to be invoked,
												// the heavier wins. If not present, weigth = 0.

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.saveTotalTime();
		command_access.sendData(socket, "Total time for all users has been saved \r\n");
	}
}
