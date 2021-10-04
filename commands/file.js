exports.command = {
	name: "file",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "Show a list of files, or a the content of one",
	help: "There can be a number of files available for you to read. This is the command used to either list or read them.",
	usage: ".file [<filename>]",

	execute: function(socket, command, command_access) {

		var chalk = require('chalk');
		command = command.trim();
		const fs = require('fs');
		const directory = './files/';

		// if command called without parameters
		if (command.trim() === "") {
			command_access.sendData(socket, chalk.cyan("+-- List of available files: --------+\r\n"));
			fs.readdirSync(directory).forEach(file => {
				command_access.sendData(socket, " " + chalk.bold(file) + "\r\n");
			});
			command_access.sendData(socket, chalk.cyan("+------------------------------------+\r\n"));
		} else {
			// if command called with parameters
			try {
				command_access.sendData(socket, "\r\n" + fs.readFileSync(directory + command) + "\r\n");
			} catch(e) {
				command_access.sendData(socket, chalk.red(":: ") + "That file isn't available.\r\n");
			}
		}
	}
}
