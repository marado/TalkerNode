exports.command = {
	name: "look",	 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "You look.",
	help: "You figure out where you are and where to can you go.",
	usage: ".look",

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.sendData(socket, chalk.green(":: ") + "You look around...\r\n");
		command_access.sendData(socket, chalk.green(":: ") + "You notice you are at " +
			chalk.cyan(command_access.getUniverse().get(socket.db.where).name) + ".\r\n");
		// look for other people
		var others = [];
		for (var i = 0; i < command_access.sockets.length; i++) {
			if (
				command_access.sockets[i].loggedin &&
				command_access.sockets[i].db.where.toString() ==
					socket.db.where.toString() &&
				command_access.sockets[i].username !== socket.username
			) {
				others.push(command_access.sockets[i].username);
			}
		}
		if (others.length > 0) {
			var peeps = chalk.green(":: ") + "You see " + chalk.yellow(others[0]);
			if (others.length === 1) {
				peeps += ".";
			} else {
				for (var p = 1; p < others.length-1; p++) {
					peeps += ", " + chalk.yellow(others[p]);
				}
				peeps += " and " + chalk.yellow(others[others.length-1]) + ".";
			}
			command_access.sendData(socket, peeps + "\r\n");
		} else {
			command_access.sendData(socket, chalk.green(":: ") + "You are alone here.\r\n");
		}

		// look for exits
		var neighbours = command_access.getUniverse().get_neighbours(
			command_access.getUniverse().get(socket.db.where));
		if (neighbours.length == 0) {
			command_access.sendData(socket, chalk.green(":: ") + "You don't see anywhere to go to.\r\n");
		} else {
			command_access.sendData(socket, chalk.green(":: ") + "You see " + chalk.bold(neighbours.length) + " passages:\r\n   ");
			for (var i=0; i < neighbours.length; i++) {
				command_access.sendData(socket, chalk.green(neighbours[i].name) + "  ");
			}
			command_access.sendData(socket, "\r\n");
		}
	}
}
