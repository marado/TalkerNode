exports.command = {
	name: "dig",
	autoload: true,
	unloadable: true,
	min_rank: 5,
	display: "creates a new place, next to where you are",
	// TODO: enhance 'help' by letting you know a list of possible directions
	help: ".dig <direction> <name> will create a new place next to here, " +
		"called <name>, in <direction>'s direction. If that place already exists, " +
		"but a passage doesn't, just create the passage.",
	usage: ".dig <direction> <name>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		direction = command.split(' ')[0];
		name = command.split(' ').slice(1).join(" "); // for now, names can have spaces
		// 'direction' needs to be a direction on Nodiverse's nomenculature (N, NE...)
		if (typeof direction !== 'string' || direction.length === 0) {
			socket.write("Syntax: .dig <direction> <name>\r\n");
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
		// name: first char needs to be a letter, can't be a dupe
		if ((typeof name !== 'string') ||
			(name.length === 0) ||
			!(/^[a-zA-Z\u00C0-\u00ff]+$/.test(name.substring(0,1)))
		) {
			socket.write("place names need to start with a letter!\r\n");
			return;
		}
		if (name === command_access.getUniverse().get(socket.db.where).name) {
			socket.write("You're already there!\r\n");
			return;
		}
		// look for exits
		var neighbours = command_access.getUniverse().get_neighbours(
			command_access.getUniverse().get(socket.db.where));
		// check if the name isn't a dupe
		for (var n = 0; n < neighbours.length; n++) {
			if (neighbours[n] !== null && neighbours[n].name === name) {
				socket.write("That place already exists!\r\n");
				return;
			}
		}
		// data entry validated, let's now see if we can dig this:
		// * if nothing's there, fine
		// * if something's there..
		//   - with the same name? we just open a door
		//   - with another name? we can't .dig it!
		target = socket.db.where.slice(0);
		if (direction.search("W") !== -1) target[0]--;
		if (direction.search("E") !== -1) target[0]++;
		if (direction.search("N") !== -1) target[1]++;
		if (direction.search("S") !== -1) target[1]--;
		if (direction.search("U") !== -1) target[2]++;
		if (direction.search("D") !== -1) target[2]--;
		targObj = command_access.getUniverse().get(target);
		if (targObj !== null) {
			// there's something there
			// FIXME: implement this: are we seeing the same place the user wants to
			//        dig to? If so, we should open a passage from here to there.
			socket.write("there's something there. " +
				"I should know how to deal with it, but I don't. " +
				"Deal with it.\r\n");
			return;
		}
		// nothing there, let's create
		var opposite = command_access.getUniverse().opposites[
			Math.log(eval("command_access.getUniverse()."+direction)) / Math.log(2)
		][1];
		if (!command_access.getUniverse().create(target, opposite)) {
			// we shouldn't be able to get here. Is this a Nodiverse bug?
			socket.write("You should have been able to dig towards " + direction +
				" from here and create a place called " + name +
				". however, that didn't work. Please let an " +
				command_access.ranks.list[command_access.ranks.list.length - 1] +
				" know about this!\r\n");
			return;
		}
		done = command_access.getUniverse().get(target);
		if (done !== null) done.name = name;
		if (!command_access.getUniverse().update(done)) {
			// we shouldn't be able to get here. Is this a Nodiverse bug?
			socket.write("You dug, but you weren't able to make the new place how you" +
				"wanted it to be. It's not your fault... and you should warn an " +
				command_access.ranks.list[command_access.ranks.list.length - 1] +
				"about this!\r\n");
			return;
		}
		// saving the altered universe
		command_access.saveUniverse();
		socket.write(":: You dig towards " + direction +
			", and create a new place called " + name + ".\r\n");
	}
}
