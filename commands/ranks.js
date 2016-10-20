exports.command = {
	name: "ranks",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "list the talker's ranks, and points out which one is yours",
	help: "List the talker's ranks, and points out which one is yours.",
	usage: ".ranks",

	execute: function(socket, command, command_access) {
        var ranks = command_access.ranks;
		socket.write("+-----------------------------------------------------------------------------+\r\n");
		for (var r = 0 ; r < ranks.list.length; r++) {
			var text = ("  " + r).slice(-3) + "\t: " + (ranks.list[r] + "            ").substr(0,11);
			if (socket.db.rank == r) text += "\t<- you";
			socket.write(text+"\r\n");
		}
		socket.write("+-----------------------------------------------------------------------------+\r\n");
	}
}
