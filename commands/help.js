var formatters = require('../utils/formatters.js');

exports.command = {
	name: "help",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "Shows all commands or information about one of them.",
	help: "Shows you this list of commands or detailed help for a particular command.",
	usage: ".help, .help <command>",

	execute: function(socket, command, command_access) {

		var userRank = socket.db.rank;
		command = command.trim();

		// if command called without parameters
		if (command.trim() === "") {
			socket.write("+-----------------------------------------------------------------------------+\r\n");
			socket.write("   Helpful commands on " + command_access.talkername + "\r\n");
			socket.write("+-----------------------------------------------------------------------------+\r\n");

			for (var l = 0; l <= userRank; l++) {
				// some separation between commands of different ranks
				socket.write("|                                                                             |\r\n");
				for (var c in command_access.commands) {
					// show commands of level l
					if (l == command_access.getCmdRank(c)) {
						var cmd = command_access.commands[c].name;
						var desc = command_access.commands[c].display;

						if(cmd.length > 10) {
							cmd = cmd.substr(0, 10);
						}

						if(desc.length > 60) {
							desc = desc.substr(0, 57) + "...";
						}

						socket.write("| ." +  cmd +
							Array(11 - cmd.length).join(' ') + " - " +
							desc + Array(62 - desc.length).join(' ') +
							" |\r\n");
					}
				}
			}
			socket.write("+-----------------------------------------------------------------------------+\r\n");
			socket.write("| Remember: all commands start with a dot (.), like .help                     |\r\n");
			socket.write("+-----------------------------------------------------------------------------+\r\n");
		} else {
			// if command called with parameters
			var commands = command_access.findCommand(socket, command);
			if (commands.length === 0) {
				socket.write("Sorry, there is no help on that topic.\r\n");
				return;
			}
			if (commands.length > 1) {
				var possibilities = "";
				for (var p = 0; p < commands.length - 1; p++) {
					possibilities += commands[p].name + ", ";
				}
				possibilities += commands[commands.length - 1].name;
				return socket.write("Found " + commands.length + " possible help files (" + possibilities + "). Please be more specific.\r\n");
			}
			var command_to_show = commands[0];

			socket.write("Command : " + command_to_show.name + "\r\n");
			socket.write("Usage   : " + command_to_show.usage + "\r\n");
			socket.write("" + "\r\n");
			socket.write(formatters.text_wrap(command_to_show.help) + "\r\n");
			socket.write("" + "\r\n");
			if (command_access.getCmdRank(command_to_show.name) === 0) {
				socket.write("Level   : Everyone!\r\n");
			} else {
				socket.write("Level   : " +
					command_access.ranks.list[
						command_access.getCmdRank(command_to_show.name)
					] + " or greater.\r\n");
			}
		}
	}
}
