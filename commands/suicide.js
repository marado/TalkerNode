exports.command = {
	name: "suicide",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "kill yourself FOREVER!",
	help: "You will delete your user, forever! You probrably don't want to do this.",
	usage: ".suicide",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.sendData(socket, chalk.bold(chalk.red(":: This action is irreversible!\r\n")));
		command_access.sendData(socket, chalk.red(":: Write '" + chalk.bold("yes, I am sure") + "' if you're sure you want to go ahead...: "));
		socket.interactive = {type:"suicide", state:"confirmation"};
	}
}
