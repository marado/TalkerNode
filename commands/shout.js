exports.command = {
	name: "shout", 			
	autoload: true,			
	unloadable: false,
	min_rank: 2,
	display: "you shout, anyone listens, even if they're not in the same place as you!",
	help: "You shout, anyone listens, even if they're not in the same place as you!",
	usage: ".shout <text>",

	execute: function(socket, command, command_access) {
        if (command === 'undefined' || command.length < 1)
            return socket.write("Shout what?\r\n");
		command_access.allButMe(socket,function(me,to){to.write("! " + me.username + " shouts: " + command + "\r\n");});
		socket.write("! You shout: " + command + "\r\n");
	}
}
