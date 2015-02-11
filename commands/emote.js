exports.command = {
	name: "emote", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you pose something, as if you were acting",
	help: "",

	execute: function(socket, command, command_access) {
        if (command === 'undefined' || command.length < 1)
            return socket.write("What are you trying to do?\r\n");
		var send = socket.username + " " + command + "\r\n";
		command_access.allButMe(socket,function(me,to){to.write(send);}); 
		socket.write(send);
	}
}
