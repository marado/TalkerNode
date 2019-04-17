exports.command = {
	name: "promote", 			// Name of command to be executed (Max 10 chars)
	autoload: true, 			// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 3,				// Minimum rank to use to execute the command
	display: "make one of your friends get a better rank!",
	help: "Make one of your friends get a better rank!",
	usage: ".promote <user>",

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var colorize = require('colorize');
		var me = socket;
		var whom = command.split(' ')[0];
		var w = null;
		// check if we got an whom
		if (typeof whom === 'undefined' || whom.length < 1) {
			return me.write("Promote whom?\r\n");
		} else { // check if it's an user
			var wArr = command_access.getAproxUser(whom);
			if (wArr.length === 0) return me.write("Promote whom?\r\n");
			if (wArr.length > 1) {
				var possibilities = "";
				for (var p = 0; p < wArr.length - 1; p++) {
					possibilities += wArr[p] + ", ";
				}
				possibilities += wArr[wArr.length - 1];
				return me.write("Be more explicit: whom do you want to promote ("+possibilities+")?\r\n");
			}
		}
		whom = wArr[0];
		w = command_access.getUser(whom);
		if (me.db.rank > w.rank) {
			// if user is online, do it via sockets
			var online = command_access.getOnlineUser(whom);
			var rankName;
			if (online) {
				online.db.rank = online.db.rank+1;
				rankName = command_access.ranks.list[online.db.rank];
				command_access.updateUser(online.username, online.db);
			} else {
				w.rank = w.rank+1;
				rankName = command_access.ranks.list[w.rank];
				command_access.updateUser(whom, w);
			}
			whom = whom.toLowerCase().charAt(0).toUpperCase() + whom.toLowerCase().slice(1);
			var sentence = ":: " + me.username + " has promoted " + whom + " to the rank of " + rankName + "! ::\r\n";
			command_access.allButMe(socket,function(me,to){to.write(sentence);});
			socket.write("You promoted " + whom + " to the rank of " + rankName + "!\r\n");
		} else {
			me.write("You cannot promote someone to an higher level than yourse!\r\n");
		}
	}
}
