exports.command = {
	name: "password", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "use this if you want to change your password",
	help: "Use this if you want to change your password.",
	usage: ".password",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.sendData(socket, chalk.green(":: ") + "Tell me your old password: ");
		command_access.sendData(socket, command_access.echo(false));
		socket.interactive = {type:"password", state:"old"};
	}
}
