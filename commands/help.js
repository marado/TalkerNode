exports.command = {
	name: "help", 			
	autoload: true,			
	unloadable: false,
	min_rank: 0,
	display: "shows you this list of commands and what do they do",
	help: "",

	execute: function(socket, command, command_access) {


		var userRank = command_access.getOnlineUser(socket.username).db.rank;

	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	    socket.write("   Helpful commands on " + command_access.talkername + "\r\n");
	    socket.write("+-----------------------------------------------------------------------------+\r\n");

	    for(var c in command_access.commands) {
	    	// Only show commands user has access to
	    	if(userRank >= command_access.commands[c].min_rank ) {
		    	var cmd = command_access.commands[c].name;
		    	var desc = command_access.commands[c].display;

		    	if(cmd.length > 10) {
		    		cmd = cmd.substr(0, 10);
		    	}

		    	if(desc.length > 60) {
		    		desc = desc.substr(0, 57) + "...";
		    	}

		    	socket.write("| ." +  cmd + Array(11 - cmd.length).join(' ') + " - " + desc + Array(62 - desc.length).join(' ') + " |\r\n");
		    } 
	    }
	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	    socket.write("| Remember: all commands start with a dot (.), like .help                     |\r\n");
	    socket.write("+-----------------------------------------------------------------------------+\r\n");
	}
}