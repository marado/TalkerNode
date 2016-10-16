exports.command = {
	name: "map",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "shows you a map of the world",
	help: "",

	execute: function(socket, command, command_access) {
		socket.write(command_access.getUniverse().asciimap());
	}
}
