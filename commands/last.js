exports.command = {
	name: "last",	 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "Shows information about users last logins", // Summary help text to show in the .help command
	help: "Shows information about users last logins.\r\n" + 
		"Without arguments, it will give you information about who last logged in.\r\n" + 
		"If you specify an user as an argument, it will show you info about his " +
		"last login instead. You can also specify how many records to show.",
	usage: ".last [<user>|<list_size>]",

	friendlyTime: function(ms) {
		if (ms < 1000) {
			return "" + ms + " ms";
		} else if (ms < (1000 * 60)) {
			return "" + Math.floor(ms / 1000) + " s";
		} else if (ms < (1000 * 60 * 60)) {
			return "" + Math.floor(ms / 1000 / 60) + " min";
		} else if (ms < (1000 * 60 * 60 * 24)) {
			return "" + Math.floor(ms / 1000 / 60 / 60) + " h";
		} else if (ms < (1000 * 60 * 60 * 24 * 30)) {
			return "" + Math.floor(ms / 1000 / 60 / 60 / 24) + " d";
		} else if (ms < (1000 * 60 * 60 * 24 * 365)) {
			var m = Math.floor(ms / 1000 / 60 / 60 / 24 / 30);
			if (m > 11) m = 11;
			return "" + m + " mon";
		}
		return "" + Math.floor(ms / 1000 / 60 / 60 / 24 / 365) + " y";
	},

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (parseInt(command.split(' ')[0]) || command.split(' ')[0] === "0") {
			// command is a number; listSize setting
			var listSize = Math.abs(parseInt(command.split(' ')[0]))+1;
		} else {
			// command is a username; whom setting
			var listSize = 15;	// size of the list of last users logging in
			var whom = command.split(' ')[0];
		}
		if (typeof whom === 'undefined' || whom.length < 1) {
			// fetch list of last listSize logins:
			if(listSize > 1)
			{
				// get all the users
				var users = command_access.getUsersList();
				// remove users without loginTime
				var cleanlist = [];
				for (var i = 0; i < users.length; i++) {
					if (typeof users[i].loginTime !== 'undefined') {
						cleanlist.push(users[i]);
					}
				}
				// sort the list
				// ...start by sorting the times
				var times = [];
				for (var i = 0; i < cleanlist.length; i++) {
					times.push(cleanlist[i].loginTime);
				}
				times.sort(function(a, b){ return b-a; });
				// ...trunk the results since we only care about showing listSize results
				var sliced = times.slice(0,listSize-1);
				// ...and then find the users for each of those times:
				if (sliced.length === 0) {
					command_access.sendData(socket, "There's nothing to let you know about, yet.\r\n");
				} else {
					command_access.sendData(socket, chalk.cyan("+----------------------------------------------------------------------------+\r\n"));
					command_access.sendData(socket, chalk.cyan("+ " + chalk.bold("These are the last users to have logged in:") + "                                +\r\n"));
					command_access.sendData(socket, chalk.cyan("+----------------------------------------------------------------------------+\r\n"));
					for (var i = 0; i < sliced.length; i++) {
						for (var j = 0; j < cleanlist.length; j++) {
							if (cleanlist[j].loginTime === sliced[i]) {
								command_access.sendData(socket, "  " + chalk.yellow(cleanlist[j].username) + 
									" logged in at " + chalk.bold(new Date(cleanlist[j].loginTime).toString()) + ".  ");
								if (command_access.getOnlineUser(cleanlist[j].username)) {
									command_access.sendData(socket, chalk.yellow.bold("ONLINE"));
								}
								command_access.sendData(socket, "\r\n");
							}
						}
					}
					command_access.sendData(socket, chalk.cyan("+----------------------------------------------------------------------------+\r\n"));
				}
			} else {
				command_access.sendData(socket, chalk.yellow + ":: So, you really don't want to know it, right?\r\n");
			}
		} else {
			var wArr = command_access.getAproxUser(whom);
			if (wArr.length === 0) return command_access.sendData(socket, chalk.red("::") + " There's no one called " + chalk.bold(whom) + ".\r\n");
			if (wArr.length > 1) {
				var possibilities = "";
				for (var p = 0; p < wArr.length - 1; p++) {
					possibilities += chalk.bold(wArr[p]) + ", ";
				}
				possibilities += chalk.bold(wArr[wArr.length - 1]);
				return command_access.sendData(socket, chalk.yellow(
					":: Be more explicit: whom do you want to refer to (" +
						possibilities + ")?\r\n"
				));
			}
			whom = wArr[0];
			w = command_access.getUser(whom);
			if (typeof w.loginTime !== 'undefined') {
				command_access.sendData(socket, chalk.green(":: " + chalk.cyan(whom) + " last logged in at " + chalk.bold(new Date(w.loginTime).toString()) + ".\r\n"));
			} else {
				command_access.sendData(socket, chalk.green(":: There is no information about when did " + chalk.cyan(whom) + " last logged in. \r\n"));
			}
			if (command_access.getOnlineUser(whom)) {
				command_access.sendData(socket, chalk.green(":: " + chalk.cyan(whom) + " is still online.\r\n"));
			}
		}
	}
}
