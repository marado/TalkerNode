exports.command = {
	name: "examine", 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "Shows information about a user",		// Summary help text to show in the .help command (Max 60 chars)
	help: "Shows information about a user.\r\n" + 
		"Without arguments, it will give you information about yourself.\r\n" + 
		"If you add another user as an argument, it will show you info about him/her instead.",			// Full help text when .help <command> is used
	usage: ".examine <user>",

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
		var whom = command.split(' ')[0];
		if (typeof whom === 'undefined' || whom.length < 1) {
			whom = socket.username;
		}
		w = command_access.getUser(whom);
		whom = whom.toLowerCase().charAt(0).toUpperCase() + whom.toLowerCase().slice(1);
		if (!w) return socket.write(":: There's no one called " + whom + ".\r\n");
		socket.write(":: You examine " + whom + " and you see... \r\n");
		if (typeof (w.registerTime) === 'undefined') {
			socket.write(":: " + whom + " was registered in an old version.\r\n");
		} else {
			socket.write(":: " + whom + " was registered at " + new Date(w.registerTime).toString() + ".\r\n");
		}
		if (typeof (w.totalTime) === 'undefined') {
			// it either is his/her first time online, or it's an old user that didn't log on recently
			if (command_access.getOnlineUser(whom) !== false) {
				socket.write(":: " + whom + " is online for the first time.\r\n");
			} else {
				socket.write(":: " + whom + " hasn't been online for a long time.\r\n");
			}
		} else {
			socket.write(":: " + whom + " has been online for " + this.friendlyTime(w.totalTime) + ".\r\n");
		}
		socket.write(":: " + whom + " is of rank " + command_access.ranks.list[w.rank] + ", and was last seen at " + command_access.getUniverse().get(w.where).name + ".\r\n");
	}
}
