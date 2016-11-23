exports.command = {
	name: "setcmdlev",
	autoload: true,
	unloadable: false,
	min_rank: 8,
	display: "Changes the rank needed to execute a command.",
	help: "This command is used to change the minimum rank an user must have to be able to " +
		"use a particular command.",
	usage: ".setcmdlev <command> <rank number>",

	execute: function(socket, command, command_access) {
		if (command.split(' ').length !== 2) {
			socket.write("Usage   : .setcmdlev <command> <rank number>\r\n");
			return;
		}
		var c = command.split(' ')[0];
		var r = command.split(' ')[1];
		var command_to_change = command_access.commands[c];
		if (!command_to_change) {
			socket.write("Sorry, there is no command called " + c + ".\r\n");
			return;
		}
		var rank_number = parseInt(r,10);
		if (Number(r) !== rank_number || rank_number < 0) {
			socket.write(r + " is no rank number.\r\n");
			return;
		}
		if (rank_number === command_access.getCmdRank(c)) {
			socket.write("Command " + c + " is already of rank level " +
				rank_number + "!\r\n");
			return;
		}
		if (rank_number >= command_access.ranks.list.length) {
			socket.write("There aren't those many ranks!\r\n");
			return;
		}
		if (command_access.getCmdRank(c) > socket.db.rank) {
			socket.write("What a joker you are... " +
				"You don't even have access to that command!\r\n");
			return;
		}
		if (rank_number > socket.db.rank) {
			socket.write("Let the grown-ups decide if they want that command " +
				"only to themselves...\r\n");
			return;
		}
		command_access.setCmdRank(c,rank_number);
		socket.write("Changed " + c + " to rank " + rank_number + ".\r\n");
	}
}
