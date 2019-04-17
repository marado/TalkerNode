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
		var colorize = require('colorize');
		if (command.split(' ').length !== 2) {
			socket.write("Usage   : .setcmdlev <command> <rank number>\r\n");
			return;
		}
		var c = command.split(' ')[0];
		var r = command.split(' ')[1];
		var commands = command_access.findCommand(socket, c);
		if (commands.length === 0) {
			socket.write("Sorry, there is no command called " + c + ".\r\n");
			return;
		}
		if (commands.length > 1) {
			var possibilities = "";
			for (var p = 0; p < commands.length - 1; p++) {
				possibilities += commands[p].name + ", ";
			}
			possibilities += commands[commands.length - 1].name;
			return socket.write("Found " + commands.length + " possible commands (" + possibilities + "). Please be more specific.\r\n");
		}
		var command_to_change = commands[0];
		var rank_number = parseInt(r,10);
		if (Number(r) !== rank_number || rank_number < 0) {
			socket.write(r + " is no rank number.\r\n");
			return;
		}
		if (rank_number === command_access.getCmdRank(command_to_change.name)) {
			socket.write("Command " + command_to_change.name + " is already of rank level " +
				rank_number + "!\r\n");
			return;
		}
		if (rank_number >= command_access.ranks.list.length) {
			socket.write("There aren't those many ranks!\r\n");
			return;
		}
		if (command_access.getCmdRank(command_to_change.name) > socket.db.rank) {
			socket.write("What a joker you are... " +
				"You don't even have access to that command!\r\n");
			return;
		}
		if (rank_number > socket.db.rank) {
			socket.write("Let the grown-ups decide if they want that command " +
				"only to themselves...\r\n");
			return;
		}
		command_access.setCmdRank(command_to_change.name,rank_number);
		socket.write("Changed " + command_to_change.name + " to rank " + rank_number + ".\r\n");
	}
}
