exports.command = {
	name: "last",	 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "Shows information about users last logins", // Summary help text to show in the .help command
	help: "Shows information about users last logins.\r\n" + 
		"Without arguments, it will give you information about who last logged in.\r\n" + 
		"If you an user as an argument, it will show you info about his last login " +
		"instead.",
	usage: ".last [<user>]",

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
		var listSize = 15;	// size of the list of last users logging in
		var whom = command.split(' ')[0];
		if (typeof whom === 'undefined' || whom.length < 1) {
			// fetch list of last listSize logins:

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
				socket.write("There's nothing to let you know about, yet.\r\n");
			} else {
	   	 		socket.write("+----------------------------------------------------------------------------+\r\n");
	   	 		socket.write("+ These are the last users to have logged in:                                +\r\n");
	   	 		socket.write("+----------------------------------------------------------------------------+\r\n");
	   	 		for (var i = 0; i < sliced.length; i++) {
					for (var j = 0; j < cleanlist.length; j++) {
						if (cleanlist[j].loginTime === sliced[i]) {
							socket.write("  " + cleanlist[j].username + 
								" logged in at " + new Date(cleanlist[j].loginTime).toString() + ".  ");
							if (command_access.getOnlineUser(cleanlist[j].username)) {
								socket.write("ONLINE");
							}
							socket.write("\r\n");
						}
					}
	   	 		}
	   	 		socket.write("+----------------------------------------------------------------------------+\r\n");
			}
		} else {
			var wArr = command_access.getAproxUser(whom);
			if (wArr.length === 0) return socket.write(":: There's no one called " + whom + ".\r\n");
			if (wArr.length > 1) {
				var possibilities = "";
				for (var p = 0; p < wArr.length - 1; p++) {
					possibilities += wArr[p] + ", ";
				}
				possibilities += wArr[wArr.length - 1];
				return socket.write(
					"Be more explicit: whom do you want to refer to (" +
						possibilities + ")?\r\n"
				);
			}
			whom = wArr[0];
			w = command_access.getUser(whom);
			if (typeof w.loginTime !== 'undefined') {
				socket.write(":: " + whom + " last logged in at " + new Date(w.loginTime).toString() + ".\r\n");
			} else {
				socket.write(":: There is no information about when did " + whom + " last logged in. \r\n");
			}
			if (command_access.getOnlineUser(whom)) {
				socket.write(":: " + whom + " is still online.\r\n");
			}
		}
	}
}
