exports.command = {
	name: "destroy",
	autoload: true,
	unloadable: true,
	min_rank: 6,
	display: "destroys a nearby place",
	help: ".destroy <direction> will destroy a nearby place, in <direction>'s direction. More info about directions in .file directions.",
	usage: ".destroy <direction>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var colorize = require('colorize');
		direction = command.split(' ')[0];
		// 'direction' needs to be a direction on Nodiverse's nomenculature (N, NE...)
		if (typeof direction !== 'string' || direction.length === 0) {
			socket.write(colorize.ansify("#bold[Syntax:] .destroy <direction>\r\n"));
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
			socket.write(colorize.ansify("#bold[" + direction + "] #red[is not a valid direction.]\r\n"));
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
			socket.write(colorize.ansify("#red[You cannot destroy the portal to this Universe!]\r\n"));
			return;
		}
		targObj = command_access.getUniverse().get(target);
		if (targObj === null) {
			socket.write(colorize.ansify("#red[There's nothing there to be destroyed!]\r\n"));
			return;
		}
		if (!command_access.getUniverse().nuke(target)) {
			// we shouldn't be able to get here. Is this a Nodiverse bug?
			socket.write(colorize.ansify("#red[You should have been able to destroy " + direction +
				" from here. However, that didn't work. #bold[Please let an " +
				command_access.ranks.list[command_access.ranks.list.length - 1] +
				" know about this!]]\r\n"));
			return;
		}
		// saving the altered universe
		command_access.saveUniverse();
		socket.write(colorize.ansify("#yellow[::] You destroyed #bold[" + direction +
			"], hopefully knowing what you're doing.\r\n"));
	}
}
