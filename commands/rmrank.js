var formatters = require('../utils/formatters.js');

exports.command = {
	name: "rmrank",
	autoload: true,
	unloadable: true,
	min_rank: 9,
	display: "removes a rank",
	help: "Removes a rank from the rank list, adjusting all the others.",
	usage: ".rmrank <rank number>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (typeof command !== 'string' || command.length < 1) {
			socket.write("What rank do you want to remove?\r\n");
			return;
		}
		// is this a valid rank number?
		var rank = parseInt(command, 10);
		if (
			Number(command) !== rank ||
			rank < 0 ||
			rank >= command_access.ranks.list.length
		) {
			socket.write("That is an invalid rank number!\r\n");
			return;
		}
		// do I have access to this rank?
		if (rank > socket.db.rank) {
			socket.write("You cannot manage ranks to which you have no access.\r\n");
			return;
		}
		// Is the rank "empty"? Let's adjust the rank of the higher commands
		for (var c in command_access.commands) {
			if (command_access.getCmdRank(c) == rank) {
				socket.write(formatters.text_wrap("Can't remove that rank: command " +
					command_access.commands[c].name +
					" exists on it. Maybe you want to .setcmdlev it to another rank?\r\n"));
				return;
			}
			if (command_access.getCmdRank(c) > rank) {
				command_access.setCmdRank(command_access.commands[c].name, command_access.getCmdRank(c) - 1);
			}
		}
		// * no users (if this isn't the highest rank))
		var highest = (rank == command_access.ranks.list.length-1);
		var users = command_access.getUsersList();
		for (var u=0; u < users.length; u++) {
			if (users[u].rank >= rank) {
				if (users[u].rank == rank && !highest) {
					socket.write(formatters.text_wrap("Can't remove that rank: user " +
						users[u].username +
						" is of that rank! You might want to .demote or .promote them first.\r\n"));
					return;
				} else {
					var online = command_access.getOnlineUser(users[u].username);
					if (online) {
						online.db.rank = online.db.rank-1;
						command_access.updateUser(online.username, online.db);
					} else {
						var w = command_access.getUser(users[u].username);
						w.rank = w.rank-1;
						command_access.updateUser(users[u].username, w);
					}
				}
			}
		}
		var updated = command_access.ranks;
		// adjust entrylevel, if needed
		if (updated.entrylevel >= rank) updated.entrylevel = updated.entrylevel - 1;
		// actually delete the rank
		updated.list.splice(command,1);
		command_access.updateRanks(updated);
		socket.write("Rank removed!\r\n");
	}
}
