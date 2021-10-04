exports.command = {
	name: "addrank",
	autoload: true,
	unloadable: true,
	min_rank: 9,
	display: "adds a rank",
	help: "Adds a rank.",
	usage: ".addrank <rank name>",
	weight: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (typeof command !== 'string' || command.length < 1) {
			command_access.sendData(socket, chalk.yellow(":: You'll have to give the new rank a name...\r\n"));
			return;
		}
		// add the new rank
		var updated = command_access.ranks;
		updated.list.push(command);
		command_access.updateRanks(updated);
		// promote top-rank users to the new rank
		var oldrank = updated.list.length - 2;
		var users = command_access.getUsersList();
		for (var u=0; u < users.length; u++) {
			if (users[u].rank === oldrank) {
				// promote users[u].username
				var online = command_access.getOnlineUser(users[u].username);
				if (online) {
					online.db.rank = online.db.rank+1;
					command_access.updateUser(online.username, online.db);
				} else {
					var w = command_access.getUser(users[u].username);
					w.rank = w.rank+1;
					command_access.updateUser(users[u].username, w);
				}
			}
		}
		command_access.sendData(socket, chalk.bold("Rank added!\r\n"));
	}
}
