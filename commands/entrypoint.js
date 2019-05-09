exports.command = {
	name: "entrypoint",
	autoload: true,
	unloadable: true,
	min_rank: 8,
	display: "sets the world's entrypoint to wherever you are",
	help: ".entrypoint sets the world's entrypoint to wherever you are.",
	usage: ".entrypoint",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.getUniverse().entrypoint = socket.db.where;
		command_access.saveUniverse();
		socket.write(chalk.green(":: ") + "The Universe's entrypoint is now here.\r\n");
	}
}
