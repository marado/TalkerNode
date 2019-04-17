exports.command = {
	name: "entrylevel",
	autoload: true,
	unloadable: true,
	min_rank: 9,
	display: "sets which rank new users start with",
	help: "Sets which rank new users start with, when they enter for the first time.",
	usage: ".entrylevel <rank number>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var colorize = require('colorize');
		if (typeof command !== 'string' || command.length < 1) {
			socket.write("What rank do you want to set as entry level?\r\n");
			return;
		}
		// is this a valid rank number?
		var rank = parseInt(command, 10);
		if (
			Number(command) !== rank ||
			rank < 0 ||
			rank >= command_access.ranks.list.length
		) {
			socket.write("That is an invalid rank number!\r\n");
			return;
		}
		// do I have access to this rank?
		if (rank > socket.db.rank) {
			socket.write("You cannot manage ranks to which you have no access.\r\n");
			return;
		}
		// is it the one we have already?
		if (command_access.ranks.entrylevel === rank) {
			socket.write("That is already the defined entry level!\r\n");
			return;
		}
		// adjust entrylevel
		var updated = command_access.ranks;
		updated.entrylevel = rank;
		command_access.updateRanks(updated);
		socket.write("Entry level updated to " + rank + ".\r\n");
	}
}
