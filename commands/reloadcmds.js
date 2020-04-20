exports.command = {
	name: "reloadcmds",
	autoload: true,
	unloadable: false,
	min_rank: 10,
	display: "reloads commands",
	help: "Reloads commands set for autoload",
	usage: ".reloadcmds",


	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		try {
			command_access.loadCommands();
			command_access.sendData(socket, chalk.green(":: ") + "Commands reloaded\r\n");
		}
		catch(err) {
			command_access.sendData(socket, chalk.red(":: ") + "Error executing command : " + err + "\r\n");
		}
	}
}
