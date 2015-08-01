exports.command = {
	name: "who", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you know who is connected in the talker at this moment",
	help: "",

	execute: function(socket, command, command_access) {
		var connected = 0;
		var connecting = 0;
		socket.write("+----------------------------------------------------------------------------+\r\n");
		socket.write("   Current users on " + command_access.talkername + " at " + new Date().toLocaleDateString() +", " + new Date().toLocaleTimeString() +"\r\n");
		socket.write("+----------------------------------------------------------------------------+\r\n");
		socket.write("  Name              Server              Rank            Where                 \r\n");
		socket.write("+----------------------------------------------------------------------------+\r\n");
		for (var i = 0; i < command_access.sockets.length; i++) {
			if ((typeof command_access.sockets[i].loggedin === 'undefined') || !command_access.sockets[i].loggedin ){
				connecting++;
			} else {
				connected++;
				socket.write(
                    "  " + (command_access.sockets[i].username + "               ").substr(0,16) +
                    "  " + (command_access.sockets[i].server.address().address + ":" + command_access.sockets[i].server.address().port + "                ").substr(0,18) +
                    "  " + (command_access.ranks.list[command_access.sockets[i].db.rank] + "             ").substr(0,14) +
                    "  " + command_access.getUniverse().get(command_access.sockets[i].db.where).name + " " + command_access.sockets[i].db.where +
                    "\r\n");
			}
		}
		socket.write("+----------------------------------------------------------------------------+\r\n");
		socket.write("     Total of " + connected + " connected users"); if (connecting > 0) { socket.write(" and " + connecting + " still connecting"); }
		socket.write("\r\n+----------------------------------------------------------------------------+\r\n");
	}
}
