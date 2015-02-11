exports.command = {
	name: "quit", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "shows you this list of commands and what do they do",
	help: "",

	execute: function(socket, command, command_access) {
		command_access.allButMe(socket,function(me,to){to.write("[Leaving is: "+ me.username + " ]\r\n");});
		socket.end('Goodbye!\n');
	}
}