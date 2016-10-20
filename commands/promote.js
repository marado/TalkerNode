exports.command = {
	name: "promote", 			// Name of command to be executed (Max 10 chars)
	autoload: true, 			// Should the command be autoloaded at startup
	unloadable: true,			// Can the command be unloaded dynamically
	min_rank: 3,				// Minimum rank to use to execute the command
	display: "make one of your friends get a better rank!",		// Summary help text to show in the .help command (Max 60 chars)
	help: "Make one of your friends get a better rank!",    // Full help text when .help <command> is used
    usage: ".promote <user>",

	// Function to execute the command
	execute: function(socket, command, command_access) {
        var me = socket;
		var whom = command.split(' ')[0];
        var w = null;
        // check if we got an whom
        if (typeof whom === 'undefined' || whom.length < 1) {
            return me.write("Promote whom?\r\n");
        } else { // check if it's an user
            w = command_access.getUser(whom); 
            if (!w) return me.write("Promote whom?\r\n");
        }
        if (me.db.rank > w.rank) {
            // if user is online, do it via sockets
            var online = command_access.getOnlineUser(whom);
            var rankName;
            if (online) {
                online.db.rank = online.db.rank+1;
                rankName = command_access.ranks.list[online.db.rank];
                command_access.updateUser(online.username, online.db);
            } else {
                w.rank = w.rank+1;
                rankName = command_access.ranks.list[w.rank];
                command_access.updateUser(whom, w);
            }
            whom = whom.toLowerCase().charAt(0).toUpperCase() + whom.toLowerCase().slice(1);
            var sentence = ":: " + me.username + " has promoted " + whom + " to the rank of " + rankName + "! ::\r\n";
            command_access.allButMe(socket,function(me,to){to.write(sentence);});
            socket.write("You promoted " + whom + " to the rank of " + rankName + "!\r\n");
        } else {
            me.write("You cannot promote someone to an higher level than yourse!\r\n");
        }
    }
}
