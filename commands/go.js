exports.command = {
	name: "go",		 			// Name of command to be executed (Max 10 chars)
	autoload: true,				// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute the command
	display: "go somewhere else",	// Summary help text to show in the .help command (Max 60 chars)
	help: "After you .look you'll know where you can go to. Then, you'll just have to .go <place>.",	// Full help text when .help <command> is used
	usage: ".go <place>",

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		var to = command.split(' ')[0];
		if ((typeof to === 'undefined') || (to.length < 1)) return command_access.sendData(socket, chalk.yellow(":: Where do you want to go to?\r\n"));
		if (to.toLowerCase() === command_access.getUniverse().get(socket.db.where).name.toLowerCase()) return command_access.sendData(socket, chalk.red(":: You are already there!\r\n"));
		var neighbours = command_access.getUniverse().get_neighbours(command_access.getUniverse().get(socket.db.where));
		if (neighbours.length == 0) return command_access.sendData(socket, chalk.yellow(":: You don't see anywhere to go to.\r\n"));
		var toId = null;
		var abrev = [];
		for (var i=0; i < neighbours.length; i++) {
			if (neighbours[i].name.toLowerCase() == to.toLowerCase()) toId = i;
			if (neighbours[i].name.toLowerCase().substring(0,to.length) == to.toLowerCase()) abrev.push(i);
		}
		if (toId == null) {
			if (abrev.length === 0) return command_access.sendData(socket, chalk.red(":: I don't know where " + chalk.bold(to) + " is...\r\n"));
			if (abrev.length > 1) {
				possibilities = "";
				for (var p = 0; p < abrev.length-1; p++) {
					possibilities += chalk.bold(neighbours[p].name) + ", ";
				}
				possibilities += neighbours[abrev[abrev.length-1]].name;
				return command_access.sendData(socket, chalk.yellow(":: There are several possible exits you might mean: " + possibilities + ". Can you be more specific?\r\n"));
			}
			toId = abrev[0];
		}

		var math=require('mathjs');
		var movement = math.subtract(socket.db.where,neighbours[toId].coords);
		var direction = "";
		if (movement[2] > 0) direction = "down";
		if (movement[2] < 0) direction = "up";
		if ((movement[0] !== 0 || movement[1] !== 0) && movement[2] != 0) {
			direction += " and ";
		}
		if (movement[1] > 0) direction += "south";
		if (movement[1] < 0) direction += "north";
		if (movement[0] > 0) direction += "west";
		if (movement[0] < 0) direction += "east";

		command_access.allHereButMe(socket,function(me,t){t.write(chalk.bold(":: " + chalk.yellow(me.username) + " starts walking to " + chalk.green(direction) + " towards " + chalk.cyan(to.toLowerCase()) + "...\r\n"));});
		command_access.sendData(socket, chalk.bold(":: You start walking to " + chalk.green(direction) + " towards " + chalk.cyan(neighbours[toId].name) + "...\r\n"));
		socket.db.where = neighbours[toId].coords;
		var tmp = command_access.getUser(socket.username);
		tmp.where = socket.db.where;
		command_access.updateUser(socket.username, tmp);
		command_access.allHereButMe(socket,function(me,to){to.write(chalk.bold(":: " + chalk.yellow(me.username) + " walks in.\r\n"));});
		command_access.sendData(socket, chalk.green(":: You arrive.\r\n"));
	}
}
