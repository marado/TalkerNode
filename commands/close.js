exports.command = {
	name: "close",
	autoload: true,
	unloadable: true,
	min_rank: 6,
	display: "closes an existent passage",
	help: ".close <direction> will close the passage in that direction. More info about directions in .file directions.",
	usage: ".close <direction>",
	weight: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		direction = command.split(' ')[0];
		// 'direction' needs to be a direction on Nodiverse's nomenculature (N, NE...)
		if (typeof direction !== 'string' || direction.length === 0) {
			command_access.sendData(socket, chalk.bold("Syntax:") + " .close <direction>\r\n");
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
			command_access.sendData(socket, direction + " is not a valid direction.\r\n");
			return;
		}
		var updateMe = command_access.getUniverse().get(socket.db.where);
		// deal with situations where the passage doesn't exist
		var newPassage = eval("command_access.getUniverse()."+direction);
		if ((updateMe.passages & newPassage) !== newPassage) {
			command_access.sendData(socket, "You cannot close a passage that doesn't exist!\r\n");
			return;
		}
		updateMe.passages -= newPassage;
		if (!command_access.getUniverse().update(updateMe)) {
			command_access.sendData(socket, "You should have been able to destroy that passage. However, " +
				"that didn't work. Please let a " +
				command_access.ranks.list[
					command_access.ranks.list.length - 1
				] + " know about this!\r\n");
		} else {
			command_access.sendData(socket, "You closed the passage.\r\n");
		}
		// saving the altered universe
		command_access.saveUniverse();
		command_access.sendData(socket, ":: You closed the passage towards " + chalk.bold(direction) + ".\r\n");
	}
}
