exports.command = {
	name: "password", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "use this if you want to change your password",
	help: "Use this if you want to change your password.",
	usage: ".password",

	execute: function(socket, command, command_access) {
		socket.write(":: Tell me your old password: ");
		socket.write(command_access.echo(false));
		socket.interactive = {type:"password", state:"old"};
	}
}
