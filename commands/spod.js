exports.command = {
	name: "spod",
	autoload: true,
	unloadable: true,
	min_rank: 2,
	display: "Shows top users per total time or login count",
	help: "Shows top users per total time. Using -l will show the top login counts.",
	usage: ".spod [-l]",
	weigth: 0,

	// Function to execute the command
	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		var formatters = require('../utils/formatters.js');
		if(command === "") { // sort by total time
			var userList = command_access.getUsersList().sort(function(a,b){return b.totalTime - a.totalTime;});
			var lengthMaxFriendlyTotalTime = formatters.friendly_time(userList[0].totalTime).length;
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
				userRow = userRow + formatters.friendly_time(userObject.totalTime).padStart(lengthMaxFriendlyTotalTime);
			}
			userRow = userRow + " : " + userObject.username + "\r\n";
			if(userRow[0] === '>') {
				command_access.sendData(socket, chalk.cyan(userRow));
			} else {
				command_access.sendData(socket, userRow);
			}
		}
		command_access.sendData(socket, chalk.cyan("\r\n+----------------------------------------------------------------------------+\r\n"));
	}
}
