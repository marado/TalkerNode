exports.command = {
	name: "who", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you know who is connected in the talker at this moment",
	help: "Lets you know who is connected in the talker at this moment.",
	usage: ".who",
	weigth: 10,

	// helper functions that should probably be global, instead of stuck here in the command file
	spaces: function(howMany) {
		ret = "";
		for (var i = 0; i < howMany; i++) {
			ret += " ";
		}
		return ret;
	},
	stringPadding: function(what, howMuch) {
		return (what + this.spaces(howMuch-1)).substr(0,howMuch);
	},
	timeString: function(time) {
		var hh = Math.floor(time/1000/60/60);
		var mm = Math.floor((time/1000/60) % 60);
		return (hh > 9 ? "" + hh : "0" + hh) + ":" + (mm > 9 ? "" + mm : "0" + mm);
	},

	execute: function(socket, command, command_access) {
		var connected = 0;
		var connecting = 0;
		socket.write("+----------------------------------------------------------------------------+\r\n");
		socket.write("   Current users on " + command_access.talkername + " at " + new Date().toLocaleDateString() +", " + new Date().toLocaleTimeString() +"\r\n");
		socket.write("+----------------------------------------------------------------------------+\r\n");
		socket.write("  Name              Server              Rank            Where      Time/Idle  \r\n");
		socket.write("+----------------------------------------------------------------------------+\r\n");
		for (var i = 0; i < command_access.sockets.length; i++) {
			if ((typeof command_access.sockets[i].loggedin === 'undefined') || !command_access.sockets[i].loggedin ){
				connecting++;
			} else {
				connected++;
				socket.write(
					"  " + this.stringPadding(command_access.sockets[i].username, 16) +
					"  " + this.stringPadding((command_access.sockets[i].server.address().address + ":" + command_access.sockets[i].server.address().port), 18)+
					"  " + this.stringPadding(command_access.ranks.list[command_access.sockets[i].db.rank], 14) +
					"  " + this.stringPadding(command_access.getUniverse().get(command_access.sockets[i].db.where).name, 8) +
					"  " + this.timeString(Date.now() - command_access.sockets[i].loginTime) + "/" + this.timeString(Date.now() - command_access.sockets[i].activityTime) +
					"\r\n");
			}
		}
		socket.write("+----------------------------------------------------------------------------+\r\n");
		socket.write("     Total of " + connected + " connected users"); if (connecting > 0) { socket.write(" and " + connecting + " still connecting"); }
		socket.write("\r\n+----------------------------------------------------------------------------+\r\n");
	}
}
