exports.command = {
	name: "shout", 			
	autoload: true,			
	unloadable: false,
	min_rank: 2,
	display: "you shout, everyone listens, no matter where they are",
	help: "You shout, everyone listens, even if they're not in the same place as you!",
	usage: ".shout <text>",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (command === 'undefined' || command.length < 1)
			return command_access.sendData(socket, chalk.red(":: ") + "Shout what?\r\n");
		command_access.allButMe(socket,function(me,to){
			to.write(chalk.bold("! ") + me.username + chalk.bold(" shouts: ") + command + "\r\n");
		});
		command_access.sendData(socket, chalk.bold("! You shout: ") + command + "\r\n");
	}
}
