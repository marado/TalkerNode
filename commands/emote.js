exports.command = {
	name: "emote", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you pose something, as if you were acting",
	help: "",

	execute: function(socket, command, command_access) {
		var send = socket.username + " " + command + "\r\n";
		command_access.allButMe(socket,function(me,to){to.write(send);}); 
		socket.write(send);
	}
}