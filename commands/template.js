exports.command = {
	name: "template", 			// Name of command to be executed (Max 10 chars)
	autoload: false,			// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 0,				// Minimum rank to use to execute them command
	display: "Moo display",		// Summary help text to show in the .help command (Max 60 chars)
	help: "Moo help",			// Full help text when .help <command> is used

	// Function to execute the command
	execute: function(socket, command, command_access) {
		socket.write("You have just executed the template command \r\n");
	}
}