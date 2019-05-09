exports.command = {
	name: "quit", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "leaves this world",
	help: "Leaves this world.",
	usage: ".quit",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command_access.allButMe(socket,function(me,to){to.write(chalk.bold("[" + chalk.red("Leaving ") + "is: "+ chalk.yellow(me.username) + " ]\r\n"));});
		socket.end(chalk.grey('Goodbye!\n'));
	}
}
