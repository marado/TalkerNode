exports.command = {
	name: "rcmds",
	autoload: true,
	unloadable: false,
	min_rank: 10,
	display: "reloads commands",
	help: "Reloads commands set for autoload",
	usage: ".rcmds",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		try {
			command_access.sendData(socket, command_access.loadCommands());
			command_access.sendData(socket, chalk.green(":: ") + "Commands reloaded\r\n");
		} catch(err) {
			command_access.sendData(socket,
				chalk.red(":: ") + "Error executing command : " + err + "\r\n");
		}
	}
}
