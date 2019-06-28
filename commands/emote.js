exports.command = {
	name: "emote", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you pose something, as if you were acting",
	help: "Lets you pose something, as if you were acting.",
	usage: ".emote <text>",
	weigth: 10,

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (command === 'undefined' || command.length < 1)
			return command_access.sendData(socket, chalk.red(":: What are you trying to do?\r\n"));
		var send = socket.username + " " + command + "\r\n";
		command_access.allHereButMe(socket,function(me,to){to.write(send);}); 
		command_access.sendData(socket, send);
	}
}
