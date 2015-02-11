exports.command = {
	name: "quit", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "shows you this list of commands and what do they do",
	help: "",

	execute: function(socket, command, command_access) {
	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	    socket.write("   Helpful commands on " + command_access.talkername + "\r\n");
	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	    socket.write("| .help     - shows you this list of commands and what do they do             |\r\n");
	    socket.write("| .say      - lets you talk with other people. Just .say something!           |\r\n");
	    socket.write("| .emote    - lets you pose something, as if you were acting.                 |\r\n");
	    socket.write("| .tell     - tells someone something, in private. Only both of you will know |\r\n");
	    socket.write("| .who      - lets you know who is connected in the talker at this moment     |\r\n");
	    socket.write("| .ranks    - list the talker's ranks, and points out which one is yourse     |\r\n");
	    socket.write("| .version  - gives you information regarding the software this talker runs   |\r\n");
	    socket.write("| .password - use this if you want to change your password                    |\r\n");
	    socket.write("| .quit     - leaving us, are you? Then .quit !                               |\r\n");
	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	    socket.write("| Remember: all commands start with a dot (.), like .help                     |\r\n");
	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	}
}