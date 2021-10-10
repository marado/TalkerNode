exports.command = {
	name: "who",
	alias: "@",
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "shows who is connected in the talker at this moment",
	help: "Lets you know who is connected in the talker at this moment.",
	usage: [".who", "@"],
  weight: 10,

	// helper functions that should probably be global, instead of stuck here in the command file
	timeString: function(time) {
		var hh = Math.floor(time/1000/60/60);
		var mm = Math.floor((time/1000/60) % 60);
		return (hh > 9 ? "" + hh : "0" + hh) + ":" + (mm > 9 ? "" + mm : "0" + mm);
	},

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		var connected = 0;
		var connecting = 0;
		var spaces = function(howMany) {
			ret = "";
			for (var i = 0; i < howMany; i++) {
				ret += " ";
			}
			return ret;
		};
		var stringPadding = function(what, howMuch) {
			// take into account invisible characters (color codes, for eg.)
			howMuch += what.length - command_access.stripAnsi(what).length;
			return (what + spaces(howMuch-1)).substr(0,howMuch);
		};

		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
		command_access.sendData(socket, chalk.cyan(
			"   Current users on " + chalk.magenta(command_access.talkername)
				+ " at " + chalk.bold(command_access.getDateTimeString())
				+ "\r\n"
		));
		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
		command_access.sendData(socket, chalk.green("  Name") + chalk.blue("              Description") + chalk.yellow("         Rank") + chalk.magenta("            Where") + chalk.cyan("      Time/Idle  \r\n"));
		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
		for (var i = 0; i < command_access.sockets.length; i++) {
			if ((typeof command_access.sockets[i].loggedin === 'undefined') || !command_access.sockets[i].loggedin ){
				connecting++;
			} else {
				connected++;
				command_access.sendData(socket, 
					"  " + stringPadding(command_access.sockets[i].username, 16) +
					"  " + stringPadding((typeof command_access.sockets[i].db.desc !== "undefined") ? command_access.sockets[i].db.desc : "has no .desc yet!", 18)+
					"  " + stringPadding(command_access.ranks.list[command_access.sockets[i].db.rank], 14) +
					"  " + stringPadding(command_access.getUniverse().get(command_access.sockets[i].db.where).name, 8) +
					"  " + this.timeString(Date.now() - command_access.sockets[i].db.loginTime) + "/" + this.timeString(Date.now() - command_access.sockets[i].activityTime) +
					"\r\n");
			}
		}
		command_access.sendData(socket, chalk.green("+----------------------------------------------------------------------------+\r\n"));
		command_access.sendData(socket, chalk.cyan("     Total of " + chalk.bold(connected) + " connected users")); if (connecting > 0) { command_access.sendData(socket, chalk.cyan(" and " + chalk.bold(connecting) + " still connecting")); }
		command_access.sendData(socket, chalk.green("\r\n+----------------------------------------------------------------------------+\r\n"));
	}
}
