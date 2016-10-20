exports.command = {
	name: "version", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "gives you information regarding the software this talker runs",
	help: "Gives you information regarding the software this talker runs.",
  usage: ".version",

	execute: function(socket, command, command_access) {
		socket.write("+------------------------------------+\r\n TalkerNode, version " + command_access.version + "\r\n https://github.com/marado/TalkerNode\r\n+------------------------------------+\r\n");
	}
}