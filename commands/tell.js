exports.command = {
	name: "tell", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "tells someone something, in private. Only both of you will know",
	help: "Tells someone something, in private. Only both of you will know...",
	usage: ".tell <user> <text>",

	execute: function(socket, command, command_access) {

		to = command.split(' ')[0];
		message = command.split(' ').slice(1).join(" ");

		if ((typeof to === 'undefined') || (typeof message === 'undefined') || to.length < 1 || message.length < 1) {
			socket.write(":: You have to use it this way: .tell someone something\r\n");
		} else if (socket.username.toLowerCase() === to.toLowerCase()) {
			socket.write(":: Talking to yourself is the first sign of madness.\r\n");
		} else {
			var s = command_access.getOnlineUser(to);
			if (s) {
				socket.write("You tell " + to + ": " + message + "\r\n");
				s.write(socket.username + " tells you: " + message + "\r\n");
			} else {
				socket.write("There is no one of that name logged on.\r\n");
			}
		}
	}
}