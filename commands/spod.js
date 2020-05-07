exports.command = {
	name: "spod", 			                                                            // Name of command to be executed (Max 10 chars)
	autoload: true,			                                                            // Should the command be autoloaded at startup
	unloadable: true,			                                                        // Can the command be unloaded dynamically
	min_rank: 0,				                                                        // Minimum rank to use to execute the command
	display: "Shows top users per total time or login count",		                    // Summary help text to show in the .help command (Max 60 chars)
	help: "Shows top users per total time. Using -l will show the top login counts",    // Full help text when .help <command> is used
	usage: ".spod [-l]",                                                           		// usage of the command
	weigth: 0,					                                                        // if two commands are elegible to be invoked,
								                                                        // the heavier wins. If not present, weigth = 0.
    
	// Function to execute the command
	execute: function(socket, command, command_access) {
        var chalk = require('chalk');
        if(command === "") { // sort by total time
            var userList = command_access.getUsersList().sort(function(a,b){return b.totalTime - a.totalTime;});
            var lengthMaxFriendlyTotalTime = command_access.friendlyTime(userList[0].totalTime).length;
            command_access.sendData(socket, "\r\n" + chalk.cyan("+-- Top Users by login time -------------------------------------------------+\r\n\r\n"));
        } else { 
            if(command === '-l') { // sort by login count
                var userList = command_access.getUsersList().sort(function(a,b){return b.loginCount - a.loginCount;});
                var lengthMaxLoginCount = userList[0].loginCount.toString().length;
                command_access.sendData(socket, "\r\n" + chalk.cyan("+-- Top Users by login count ------------------------------------------------+\r\n\r\n"));    
            } else { // invalid argument
                command_access.sendData(socket, "Invalid argument. Check .help " + this.name + " for usage instructions.\r\n");    
                return;
            }    
        }
        for (let index = 0; index < userList.length; index++) {
            const userObject = userList[index];
            
            if(socket.username == userObject.username) { // hey, it's me!
                var userRow = "> ";
            } else {
                var userRow = "  ";
            }
            if(command === '-l') {
                userRow = userRow + userObject.loginCount.toString().padStart(lengthMaxLoginCount) + " logins";
            } else {
                userRow = userRow + command_access.friendlyTime(userObject.totalTime).padStart(lengthMaxFriendlyTotalTime);
            }
            userRow = userRow + " : " + userObject.username + "\r\n";
            if(userRow[0] === '>')
            {
                command_access.sendData(socket, chalk.cyan(userRow));
            } else {
                command_access.sendData(socket, userRow);
            }
        }
		command_access.sendData(socket, chalk.cyan("\r\n+----------------------------------------------------------------------------+\r\n"));
	}
}
