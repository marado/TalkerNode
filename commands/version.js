exports.command = {
	name: "version", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "information about the talker's software",
	help: "Gives you information regarding the software this talker runs.",
	usage: ".version",

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		socket.write("+------------------------------------+\r\n TalkerNode, version " +
			command_access.version +
			"\r\n https://github.com/marado/TalkerNode\r\n" +
			"+------------------------------------+\r\n");
	}
}
