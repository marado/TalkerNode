exports.command = {
	name: "setcmdlev",
	autoload: true,
	unloadable: false,
	min_rank: 7,
	display: "Changes the rank needed to execute a command.",
	help: "This command is used to change the minimum rank an user must have to be able to " +
		"use a particular command.",
	usage: ".setcmdlev <command> <rank number>",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (command.split(' ').length !== 2) {
			socket.write(chalk.bold("Usage   :") + " .setcmdlev <command> <rank number>\r\n");
			return;
		}
		var c = command.split(' ')[0];
		var r = command.split(' ')[1];
		var commands = command_access.findCommand(socket, c);
		if (commands.length === 0) {
			socket.write(chalk.ref(":: ") + "Sorry, there is no command called " + chalk.bold(c) + ".\r\n");
			return;
		}
		if (commands.length > 1) {
			var possibilities = "";
			for (var p = 0; p < commands.length - 1; p++) {
				possibilities += chalk.bold(commands[p].name) + ", ";
			}
			possibilities += chalk.bold(commands[commands.length - 1].name);
			return socket.write(chalk.yellow(":: ") + "Found " + chalk.cyan(commands.length) + " possible commands (" + possibilities + "). Please be more specific.\r\n");
		}
		var command_to_change = commands[0];
		var rank_number = parseInt(r,10);
		if (Number(r) !== rank_number || rank_number < 0) {
			socket.write(chalk.red(":: ") + chalk.bold(r) + " is no rank number.\r\n");
			return;
		}
		if (rank_number === command_access.getCmdRank(command_to_change.name)) {
			socket.write(chalk.red(":: ") + "Command " + chalk.bold(command_to_change.name) + " is already of rank level " +
				chalk.cyan(rank_number) + "!\r\n");
			return;
		}
		if (rank_number >= command_access.ranks.list.length) {
			socket.write(chalk.red(":: ") + "There aren't those many ranks!\r\n");
			return;
		}
		if (command_access.getCmdRank(command_to_change.name) > socket.db.rank) {
			socket.write(chalk.red(":: ") + "What a joker you are... " +
				"You don't even have access to that command!\r\n");
			return;
		}
		if (rank_number > socket.db.rank) {
			socket.write(chalk.red(":: ") + "Let the grown-ups decide if they want that command " +
				"only to themselves...\r\n");
			return;
		}
		command_access.setCmdRank(command_to_change.name,rank_number);
		socket.write(chalk.green(":: ") + "Changed " + chalk.bold(command_to_change.name) + " to rank " + chalk.cyan(rank_number) + ".\r\n");
	}
}
