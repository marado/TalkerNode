exports.command = {
	name: "say", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "lets you talk with other people. Just .say something!",
	help: "Lets you talk with other people. Just .say something!",
	usage: ".say <text>",

	// Cleans up strings from the first few* characters of the ASCII table,
	// getting us rid of nasty control characters and other potentially
	// malicious input.
	// TODO: implement the same mechanism on other speech commands, like .tell,
	// .shout, .emote...
	cleanUp: function(input) {
		var output = "";
		for (var i = 0; i < input.length; i++) {
			if (input.charCodeAt(i) > 31) {
				output += input.charAt(i);
			}
		}
		return output;
	},

	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		command = this.cleanUp(command);
 		if (command === 'undefined' || command.length < 1)
			return command_access.sendData(socket, chalk.red(":: ") + "Say what? ~RS\r\n");
		command_access.allHereButMe(socket, function(me,to){
			command_access.sendData(to, me.username + chalk.bold(" says: ") + command + " ~RS\r\n");
		});
		command_access.sendData(socket, chalk.bold("You said: ") + command + " ~RS\r\n");
	}
}
