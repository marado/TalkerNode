exports.command = {
	name: "say", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you talk with other people. Just .say something!",
	help: "Lets you talk with other people. Just .say something!",
	usage: ".say <text>",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
 		if (command === 'undefined' || command.length < 1)
			return command_access.sendData(socket, chalk.red(":: ") + "Say what?\r\n");
		command_access.allHereButMe(socket,function(me,to){to.write(me.username + chalk.bold(": ") + command + "\r\n");});
		command_access.sendData(socket, chalk.bold("You said: ") + command + "\r\n");
	}
}
