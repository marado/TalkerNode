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

	friendlyTime: function (ms) {
		let msec, sec, min, hour, day, month, year;
		msec = Math.floor(ms % 1000);
		sec = Math.floor((ms / 1000) % 60);
		min = Math.floor((ms / 1000 / 60) % 60);
		hour = Math.floor((ms / 1000 / 60 / 60) % 24);
		day = Math.floor((ms / 1000 / 60 / 60 / 24) % 30);
		month = Math.floor((ms / 1000 / 60 / 60 / 24 / 30) % 12);
		year = Math.floor((ms / 1000 / 60 / 60 / 24 / 30 / 12));
		let f_time = "";
		if (msec) {
			f_time = msec + " milliseconds" + f_time;
		}
		if (sec) {
			f_time = sec + " seconds, " + f_time;
		}
		if (min) {
			f_time = min + " minutes, " + f_time;
		}
		if (hour) {
			f_time = hour + " hours, " + f_time;
		}
		if (day) {
			f_time = day + " days, " + f_time;
		}
		if (month) {
			f_time = month + " months, " + f_time;
		}
		if (month) {
			f_time = year + " years, " + f_time;
		}
		return f_time;
	},

	// Function to execute the command
	execute: function (socket, command, command_access) {
		var chalk = require('chalk');
		var whom = command.split(' ')[0];
		if (typeof whom === 'undefined' || whom.length < 1) {
			whom = socket.username;
		}
		var wArr = command_access.getAproxUser(whom);
		if (wArr.length === 0) return command_access.sendData(socket, chalk.red(":: ") + "There's no one called " + chalk.bold(whom) + ".\r\n");
		if (wArr.length > 1) {
			var possibilities = "";
			for (var p = 0; p < wArr.length - 1; p++) {
				possibilities += chalk.cyan(wArr[p]) + ", ";
			}
			possibilities += chalk.cyan(wArr[wArr.length - 1]);
			return command_access.sendData(socket, chalk.yellow(":: Be more explicit: ") + "whom do you want to examine (" + possibilities + ")?\r\n");
		}
		whom = wArr[0];
		w = command_access.getUser(whom);
		command_access.sendData(socket, chalk.bold(":: ") + "You examine " + chalk.cyan(whom) + " and you see... \r\n");
		if (typeof (w.registerTime) === 'undefined') {
			command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " was " + chalk.green("registered") + " in an " + chalk.bold("old version") + ".\r\n");
		} else {
			command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " was " + chalk.green("registered") + " at " + chalk.bold(new Date(w.registerTime).toString()) + ".\r\n");
		}
		if (typeof (w.totalTime) === 'undefined') {
			// it either is his/her first time online, or it's an old user that
			// didn't log on recently
			if (command_access.getOnlineUser(whom) === false) {
				command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " hasn't been " + chalk.green("online") + " for a " + chalk.bold("long time") + ".\r\n");
			} else {
				// we should always be going into this if, but let's double check anyway
				if (typeof w.loginTime !== 'undefined') {
					command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " has spent " + chalk.bold(this.friendlyTime(Date.now() - w.loginTime)) + chalk.green(" online") + ".\r\n");
				}
			}
		} else {
			if (command_access.getOnlineUser(whom) !== false) {
				// the user is currently online
				command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " has spent " + chalk.bold(this.friendlyTime(w.totalTime + (Date.now() - w.loginTime))) + chalk.green(" online") + ".\r\n");
			} else {
				// the user isn't online
				command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " has spent " + chalk.bold(this.friendlyTime(w.totalTime)) + chalk.green(" online") + ".\r\n");
			}
		}
		command_access.sendData(socket,
			chalk.bold(":: ") + chalk.cyan(whom) + " is of rank " + chalk.bold(command_access.ranks.list[w.rank]) +
			", and was last seen at " + chalk.yellow(command_access.getUniverse().get(w.where).name) + ".\r\n"
		);
		if (typeof w.loginTime !== 'undefined') {
			command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " last logged in at " + chalk.bold(new Date(w.loginTime).toString()) + ".\r\n");
		}
		if (typeof w.loginCount !== 'undefined') {
			command_access.sendData(socket, chalk.bold(":: ") + chalk.cyan(whom) + " has logged in " + chalk.bold(w.loginCount) + " times.\r\n");
		}
	}
}
