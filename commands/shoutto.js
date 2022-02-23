const chalk = require("chalk");
exports.command = {
	name: "shoutto",
	aka: "sto",
	alias: "]",
	autoload: true,
	unloadable: false,
	min_rank: 2,
	display: "you shout to someone, everyone logged in hears",
	help: "You shout to someone and everyone can hear, even if they're not in the same place as you!",
	usage: [".shoutto <user> <text>", ".sto <user> <text>", "] <user> <text>"],

	execute: function(socket, command, command_access) {
		let chalk = require('chalk');
		let to = command.split(' ')[0];
		let message = command.split(' ').slice(1).join(' ');

		if ((typeof to === 'undefined') || (typeof message === 'undefined') || to.length < 1 || message.length < 1) {
			return command_access.sendData(socket, chalk.yellow(":: ") + "You have to use it this way:" + chalk.yellow(" .shoutto <user> <text>\r\n"));
		}

		let possibleUsers = command_access.getAproxOnlineUserExcluding(to, socket.username, true);
		if (!possibleUsers.length) {
			return command_access.sendData(socket, chalk.red(":: ") + `You cannot see ${to}, so you cannot shout anything to them!\r\n`);
		} else if (possibleUsers.length === 1) {
			if (socket.username.toLowerCase() === possibleUsers[0].username.toLowerCase()) {
				return command_access.sendData(socket, chalk.red(":: ") + "Talking to yourself is the first sign of madness.\r\n");
			}
			command_access.allButMe(socket,function(me, to) {
				command_access.sendData(to, `${chalk.bold('!')} ${me.username} ${chalk.bold('shouts')} to ${chalk.bold(possibleUsers[0].username)}: ${message} ~RS\r\n`);
			});
			command_access.sendData(socket, `${chalk.bold('!')} You ${chalk.bold('shout')} to ${chalk.bold(possibleUsers[0].username)}: ${message} ~RS\r\n`);
		} else {
			let possibilities = "";
			for (let p = 0; p < possibleUsers.length - 1; p++) {
				possibilities += chalk.bold(possibleUsers[p].username) + ", ";
			}
			possibilities += chalk.bold(possibleUsers[possibleUsers.length - 1].username);
			command_access.sendData(socket, chalk.yellow(":: ") + "Be more explicit: whom do you want to say to ("+possibilities+")?\r\n");
		}
	}
}
