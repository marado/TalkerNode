exports.command = {
	name: "pager",
	autoload: false,	// feature still incomplete, check TalkerNode.js' sendData
	unloadable: false,
	min_rank: 1,
	display: "toggle pager on or off, for you",
	help: "Toggles pager on or off, for you. If you want no pager, set it to 0.",
	usage: ".pager <length>",


	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (typeof command !== 'string' || command.length < 1) {
			// TODO: add here the info on the current pager setting (should it also be somewhere else?)
			command_access.sendData(socket, chalk.yellow(":: You'll have to choose a pager length...\r\n"));
			return;
		}
		if (/^\+?(0|[1-9]\d*)$/.test(command)) {
			socket.db.pager = parseInt(command);
			command_access.updateUser(socket.username, socket.db);
			command_access.sendData(socket, chalk.green("[::] ") + "You have the pager setting: " + socket.db.pager + "\r\n");
		} else {
			command_access.sendData(socket, chalk.yellow(":: Length needs to be an integer value...\r\n"));
		}
	}
}
