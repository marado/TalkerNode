exports.command = {
	name: "quit", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "leaves this world",
	help: "Leaves this world.",
	usage: ".quit",

	execute: function(socket, command, command_access) {
		command_access.allButMe(socket,function(me,to){to.write("[Leaving is: "+ me.username + " ]\r\n");});
		socket.end('Goodbye!\n');
	}
}