exports.command = {
	name: "emote",
	alias: [':', ';'],
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you pose something, as if you were acting",
	help: "Lets you pose something, as if you were acting.",
	usage: [".emote <text>", ":<text>", ";<text>"],
	weight: 10,

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		if (command === 'undefined' || command.length < 1)
			return command_access.sendData(socket, chalk.red(":: What are you trying to do?\r\n"));
		var send = socket.username + " " + command + " ~RS\r\n";
		command_access.allHereButMe(socket,function(me,to){command_access.sendData(to,send);});
		command_access.sendData(socket, send);
	}
}
