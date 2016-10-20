exports.command = {
	name: "go",		 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "go somewhere else",	// Summary help text to show in the .help command (Max 60 chars)
	help: "After you .look you'll know where you can go to. Then, you'll just have to .go <place>.",	// Full help text when .help <command> is used
	usage: ".go <place>",

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var to = command.split(' ')[0];
		if ((typeof to === 'undefined') || (to.length < 1)) return socket.write("Where do you want to go to?\r\n");
		if (to.toLowerCase() === command_access.getUniverse().get(socket.db.where).name.toLowerCase()) return socket.write("You are already there!\r\n");
		var neighbours = command_access.getUniverse().get_neighbours(command_access.getUniverse().get(socket.db.where));
		if (neighbours.length == 0) return socket.write("You don't see anywhere to go to.\r\n");
		var toId = null;
		for (var i=0; i < neighbours.length; i++) {
			if (neighbours[i].name.toLowerCase() == to.toLowerCase()) toId = i;
		}
		if (toId == null) return socket.write("I don't know where " + to + " is...\r\n");
		command_access.allHereButMe(socket,function(me,t){t.write(": " + me.username + " starts walking towards " + to.toLowerCase() + "...\r\n");});
		socket.write(": You start walking towards " + to.toLowerCase() + "...\r\n");
		socket.db.where = neighbours[toId].coords;
		var tmp = command_access.getUser(socket.username);
		tmp.where = socket.db.where;
		command_access.updateUser(socket.username, tmp);
		command_access.allHereButMe(socket,function(me,to){to.write(": " + me.username + " walks in.\r\n");});
		socket.write(": You arrive.\r\n");
	}
}
