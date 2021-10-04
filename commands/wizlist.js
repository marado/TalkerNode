exports.command = {
	name: "wizlist", 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "list of Wizards",// Summary help text to show in the .help command (Max 60 chars)
	help: "List of Wizards.", 	// Full help text when .help <command> is used
	usage: ".wizlist",

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		var users = command_access.getUsersList();
		var toShow = command_access.ranks.list.length;
		if (toShow > 3) toShow = 3;
		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
		var someone = false;
		var online = "";
		for (var level = command_access.ranks.list.length-1; level > command_access.ranks.list.length-1-toShow; level--) {
			command_access.sendData(socket, chalk.yellow.bold(command_access.ranks.list[level]) + "\t: ");
			online += chalk.blue.bold(command_access.ranks.list[level]) + "\t: ";
			var counter = 0;
			var ocounter = 0;
			for (var u = 0; u < users.length; u++) {
				if (users[u].rank === level) {
					if (command_access.getOnlineUser(users[u].username)) {
						someone = true;
						ocounter++;
						if (ocounter !== 0 && ocounter % 8 === 0)
							online += "\n\t  ";
						online += users[u].username + "\t";
					}
					if (counter !== 0 && counter % 8 === 0)
						command_access.sendData(socket, "\n\t  ");
					command_access.sendData(socket, users[u].username + "\t");
					counter++;
				}
			}
			command_access.sendData(socket, "\r\n");
			online += "\r\n";
		}
		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
		if (someone) {
			command_access.sendData(socket, chalk.bold("Of which, these are online:\r\n") + online);
		} else {
			command_access.sendData(socket, chalk.grey("None of them online at this moment.\r\n"));
		}
		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
	}
}
