exports.command = {
	name: "rntalker",
	autoload: true,
	unloadable: true,
	min_rank: 10,
	display: "renames the talker!",
	help: ".rntalker <new-name> will change this talker name to <new-name>.",
	usage: ".rntalker <new-name>",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var colorize = require('colorize');
		name = command.split(' ').slice(0).join(" "); // for now, names can have spaces
		if ((typeof name) !== 'string' || name.length === 0) {
			socket.write("You better type .help rntalker !\r\n");
			return;
		}
		command_access.getUniverse().name = name;
		command_access.saveUniverse();
		command_access.reloadTalkerName();
		socket.write(":: This talker is now " + name + ".\r\n");
	}
}
