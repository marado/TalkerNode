exports.command = {
	name: "look",	 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "You look.",		// Summary help text to show in the .help command (Max 60 chars)
	help: "You figure out where you are and where to can you go",			// Full help text when .help <command> is used

	// Function to execute the command
	execute: function(socket, command, command_access) {
		socket.write("You look around...\r\n");
		socket.write("You notice you are at " + command_access.getUniverse().get(socket.db.where).name + ".\r\n");

		var neighbours = command_access.getUniverse().get_neighbours(command_access.getUniverse().get(socket.db.where));
		if (neighbours.length == 0) {
			socket.write("You don't see anywhere to go to.\r\n");
		} else {
			socket.write("You see " + neighbours.length + " passages:\r\n   ");
			for (var i=0; i < neighbours.length; i++) {
				socket.write(neighbours[i].name + "  ");
			}
			socket.write("\r\n");
		}
	}
}
