exports.command = {
	name: "version", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "information about the talker's software",
	help: "Gives you information regarding the software this talker runs.",
	usage: ".version",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.sendData(socket, chalk.green("+------------------------------------+\r\n") + chalk.cyan(" TalkerNode") + chalk.yellow(", version ") +
			chalk.bold(command_access.version) +
			chalk.magenta("\r\n https://github.com/marado/TalkerNode\r\n") +
			chalk.green("+------------------------------------+\r\n"));
	}
}
