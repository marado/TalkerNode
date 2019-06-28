exports.command = {
	name: "map",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "shows you a map of the world",
	help: "Shows you a map of the world.",
	usage: ".map",

	execute: function(socket, command, command_access) {
		command_access.sendData(socket, command_access.getUniverse().asciimap(socket.db.where, true));
	}
}
