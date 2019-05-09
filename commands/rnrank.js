exports.command = {
	name: "rnrank",
	autoload: true,
	unloadable: true,
	min_rank: 9,
	display: "renames a rank",
	help: "Renames a rank.",
	usage: ".rnrank <rank number> <new-name>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		rank = command.split(' ')[0];
		name = command.split(' ').slice(1).join(" ");
		if (
			typeof rank === 'undefined' ||
			typeof name === 'undefined' ||
			rank.length < 1 ||
			name.length < 1 ||
			typeof name !== 'string' ||
			name.length === 0
		) {
			socket.write(chalk.yellow(":: ") + "You better type .help rnrank !\r\n");
			return;
		}
		var rank_number = parseInt(rank, 10);
		if (
			Number(rank) !== rank_number ||
			rank_number < 0 ||
			rank_number >= command_access.ranks.list.length
		) {
			socket.write(chalk.red(":: ") + "That is an invalid rank number!\r\n");
			return;
		}
		if (rank_number > socket.db.rank) {
			socket.write(chalk.red(":: ") + "You cannot manage ranks to which you have no access.\r\n");
			return;
		}

		var updated = command_access.ranks;
		updated.list[rank_number] = name;
		command_access.updateRanks(updated);
		socket.write(chalk.green(":: rank name updated.\r\n"));
	}
}
