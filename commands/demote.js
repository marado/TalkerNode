exports.command = {
	name: "demote", 			// Name of command to be executed (Max 10 chars)
	autoload: true, 			// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 3,				// Minimum rank to use to execute the command
	display: "Lower someone's rank!",	// Summary help text to show in the .help command (Max 60 chars)
	help: "Lower someone's rank!",		// Full help text when .help <command> is used
	usage: ".demote <user>",		// Full help text when .help <command> is used

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		var me = socket;
		var whom = command.split(' ')[0];
		var w = null;
		// check if we got an whom
		if (typeof whom === 'undefined' || whom.length < 1) {
			return me.write("Demote whom?\r\n");
		} else { // check if it's an user
			var wArr = command_access.getAproxUser(whom);
			if (wArr.length === 0) return me.write("Demote whom?\r\n");
			if (wArr.length > 1) {
				var possibilities = "";
				for (var p = 0; p < wArr.length - 1; p++) {
					possibilities += wArr[p] + ", ";
				}
				possibilities += wArr[wArr.length - 1];
				return me.write("Be more explicit: whom do you want to demote ("+possibilities+")?\r\n");
			}
			whom = wArr[0];
			w = command_access.getUser(whom);
		}
		if (w.rank == 0) {
			socket.write("How low do you think someone can be?\r\n");
		} else if (me.db.rank > w.rank) {
			// if user is online, do it via sockets
			var online = command_access.getOnlineUser(whom);
			var rankName;
			if (online) {
				online.db.rank = online.db.rank-1;
				rankName = command_access.ranks.list[online.db.rank];
				command_access.updateUser(online.username, online.db);
			} else {
				w.rank = w.rank-1;
				rankName = command_access.ranks.list[w.rank];
				command_access.updateUser(whom, w);
			}
			whom = whom.toLowerCase().charAt(0).toUpperCase() + whom.toLowerCase().slice(1);
			var sentence = chalk.red(":: ") + chalk.white(me.username) + chalk.red(" has demoted ") +
					chalk.yellow(whom) + chalk.red(" to the rank of ") + chalk.green(rankName) + chalk.red("! ::\r\n");
			command_access.allButMe(socket,function(me,to){to.write(sentence);});
			socket.write("You " + chalk.red("demoted ") + chalk.yellow(whom) + " to the rank of " + chalk.green(rankName) + "!\r\n");
		} else {
			me.write("You cannot demote someone with the same or an higher rank than yours!\r\n");
		}
	}
}
