var formatters = require('../utils/formatters.js');
const chalk = require("chalk");

exports.command = {
	name: "help",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "Shows all commands or information about one of them.",
	help: "Shows you this list of commands or detailed help for a particular command.",
	usage: ".help [<command>]",

	execute: function(socket, command, command_access) {

		var chalk = require('chalk');
		var userRank = socket.db.rank;
		command = command.trim();

		// if command called without parameters
		if (command.trim() === "") {
			command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));
			command_access.sendData(socket, "   Helpful commands on " + chalk.bold(command_access.talkername) + "\r\n");
			command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));

			for (var l = 0; l <= userRank; l++) {
				// some separation between commands of different ranks
				command_access.sendData(socket, chalk.blue("|                                                                             |\r\n"));
				for (var c in command_access.commands) {
					// show commands of level l
					if (l == command_access.getCmdRank(c)) {
						var cmd = command_access.commands[c].name;
						var desc = command_access.monotone(command_access.commands[c].display);
						var aliases = '';
						if ('alias' in command_access.commands[c]) {
							aliases = ' (';
							if (command_access.commands[c].alias instanceof Array) {
								aliases += command_access.commands[c].alias.join('');
							} else {
								aliases += command_access.commands[c].alias;
							}
							aliases += ')';
						}

						if(cmd.length > 10) {
							cmd = cmd.substr(0, 10);
						}

						if(desc.length > 58) {
							desc = desc.substr(0, 55) + "...";
						}

						command_access.sendData(socket, chalk.blue("| " + chalk.bold("." + cmd + aliases)
							+ Array((13 - aliases.length) - cmd.length).join(' ')
							+ chalk.yellow(" - ") + chalk.green(desc)
							+ Array(60 - desc.length).join(' ') + " |\r\n"));
					}
				}
			}
			command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));
			command_access.sendData(socket, chalk.blue("| " + chalk.white.bold("Remember: ") + chalk.magenta("all commands start with a dot (" + chalk.bold(".") + "), like " + chalk.blue.bold(".help")) + "                     |\r\n"));
			command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));
		} else {
			// if command called with parameters
			var commands = command_access.findCommand(socket, command);
			if (commands.length === 0) {
				command_access.sendData(socket, chalk.yellow(":: Sorry, there is no help on that topic.\r\n"));
				return;
			}
			if (commands.length > 1) {
				var possibilities = "";
				for (var p = 0; p < commands.length - 1; p++) {
					possibilities += chalk.bold(commands[p].name) + ", ";
				}
				possibilities += chalk.bold(commands[commands.length - 1].name);
				return command_access.sendData(socket, chalk.yellow(":: Found " + chalk.magenta(commands.length) + " possible help files (" + possibilities + "). Please be more specific.\r\n"));
			}
			var command_to_show = commands[0];

			command_access.sendData(socket, chalk.bold("Command : ") + command_to_show.name + "\r\n");
			if (command_to_show.usage instanceof Array) {
				command_to_show.usage.map((usage, index) => {
					let prefix = !index ? 'Usage   : ' : '        : ';
					command_access.sendData(socket, chalk.bold(prefix) + usage + "\r\n");
				});
			} else {
				command_access.sendData(socket, chalk.bold("Usage   : ") + command_to_show.usage + "\r\n");
			}
			command_access.sendData(socket, "" + "\r\n");
			command_access.sendData(socket, formatters.text_wrap(command_to_show.help) + "\r\n");
			command_access.sendData(socket, "" + "\r\n");
			if (command_access.getCmdRank(command_to_show.name) === 0) {
				command_access.sendData(socket, chalk.bold("Level   :") + " Everyone!\r\n");
			} else {
				command_access.sendData(socket, chalk.bold("Level   : ") +
					chalk.green(command_access.ranks.list[
						command_access.getCmdRank(command_to_show.name)
					]) + " or greater.\r\n");
			}
		}
	}
}
