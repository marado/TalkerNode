exports.command = {
	name: "examine", 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "Shows information about a user", // Summary help text to show in the .help command
	help: "Shows information about a user.\r\n" + 
		"Without arguments, it will give you information about yourself.\r\n" + 
		"If you add another user as an argument, it will show you info about him/her " +
		"instead.",
	usage: ".examine [<user>]",

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
		var whom = command.split(' ')[0];
		if (typeof whom === 'undefined' || whom.length < 1) {
			whom = socket.username;
		}
		var wArr = command_access.getAproxUser(whom);
		if (wArr.length === 0) return socket.write(chalk.red(":: ") + "There's no one called " + chalk.bold(whom) + ".\r\n");
		if (wArr.length > 1) {
			var possibilities = "";
			for (var p = 0; p < wArr.length - 1; p++) {
				possibilities += chalk.cyan(wArr[p]) + ", ";
			}
			possibilities += chalk.cyan(wArr[wArr.length - 1]);
			return socket.write(chalk.yellow(":: Be more explicit: ") + "whom do you want to examine (" + possibilities + ")?\r\n");
		}
		whom = wArr[0];
		w = command_access.getUser(whom);
		socket.write(chalk.bold(":: ") + "You examine " + chalk.cyan(whom) + " and you see... \r\n");
		if (typeof (w.registerTime) === 'undefined') {
			socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " was " + chalk.green("registered") + " in an " + chalk.bold("old version") + ".\r\n");
		} else {
			socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " was " + chalk.green("registered") + " at " + chalk.bold(new Date(w.registerTime).toString()) + ".\r\n");
		}
		if (typeof (w.totalTime) === 'undefined') {
			// it either is his/her first time online, or it's an old user that
			// didn't log on recently
			if (command_access.getOnlineUser(whom) !== false) {
				socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " is " + chalk.green("online") + " for the " + chalk.bold("first time") + ".\r\n");
			} else {
				socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " hasn't been " + chalk.green("online") + " for a " + chalk.bold("long time") + ".\r\n");
			}
		} else {
			socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " has been " + chalk.green("online") + " for " + chalk.bold(this.friendlyTime(w.totalTime)) + ".\r\n");
		}
		socket.write(
			chalk.bold(":: ") + chalk.cyan(whom) + " is of rank " + chalk.bold(command_access.ranks.list[w.rank]) +
			", and was last seen at " + chalk.yellow(command_access.getUniverse().get(w.where).name) + ".\r\n"
		);
		if (typeof w.loginTime !== 'undefined') {
			socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " last logged in at " + chalk.bold(new Date(w.loginTime).toString()) + ".\r\n");
		}
		if (typeof w.loginCount !== 'undefined') {
			socket.write(chalk.bold(":: ") + chalk.cyan(whom) + " has logged in " + chalk.bold(w.loginCount) + " times.\r\n");
		}
	}
}
