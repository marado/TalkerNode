exports.command = {
	name: "destroy",
	autoload: true,
	unloadable: true,
	min_rank: 6,
	display: "destroys a nearby place",
	// TODO: enhance 'help' by letting you know a list of possible directions
	help: ".destroy <direction> will destroy a nearby place, in <direction>'s direction.",
	usage: ".destroy <direction>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		direction = command.split(' ')[0];
		// 'direction' needs to be a direction on Nodiverse's nomenculature (N, NE...)
		if (typeof direction !== 'string' || direction.length === 0) {
			socket.write("Syntax: .destroy <direction>\r\n");
			return;
		}
		// FIXME: we're assuming that any uppercased string key with a
		//        number value is an exit... we should be more strict about
		//        this.
		valid = false;
		if (direction.toUpperCase() === direction) {
			for (var i in command_access.getUniverse()) {
				if (i === direction &&
					typeof command_access.getUniverse()[i] === 'number'
				)
					valid = true;
			}
		}
		if (!valid) {
			socket.write(direction + " is not a valid direction.\r\n");
			return;
		}
		// look for exits
		var neighbours = command_access.getUniverse().get_neighbours(
			command_access.getUniverse().get(socket.db.where));
		var target = socket.db.where.slice(0);
		if (direction.search("W") !== -1) target[0]--;
		if (direction.search("E") !== -1) target[0]++;
		if (direction.search("N") !== -1) target[1]++;
		if (direction.search("S") !== -1) target[1]--;
		if (direction.search("U") !== -1) target[2]++;
		if (direction.search("D") !== -1) target[2]--;
		if (target.toString() === command_access.getUniverse().entrypoint.toString()) {
			socket.write("You cannot destroy the portal to this Universe!\r\n");
			return;
		}
		targObj = command_access.getUniverse().get(target);
		if (targObj === null) {
			socket.write("There's nothing there to be destroyed!\r\n");
			return;
		}
		if (!command_access.getUniverse().nuke(target)) {
			// we shouldn't be able to get here. Is this a Nodiverse bug?
			socket.write("You should have been able to destroy " + direction +
				" from here. However, that didn't work. Please let an " +
				command_access.ranks.list[command_access.ranks.list.length - 1] +
				" know about this!\r\n");
			return;
		}
		// saving the altered universe
		command_access.saveUniverse();
		socket.write(":: You destroyed " + direction +
			", hopefully knowing what you're doing.\r\n");
	}
}
