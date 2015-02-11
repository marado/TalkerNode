exports.command = {
	name: "say", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you talk with other people. Just .say something!",
	help: "",

	execute: function(socket, command, command_access) {
		command_access.allButMe(socket,function(me,to){to.write(me.username + ": " + command + "\r\n");});
		socket.write("You said: " + command + "\r\n");
	}
}