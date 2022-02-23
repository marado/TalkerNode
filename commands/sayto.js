exports.command = {
	name: "sayto",
	aka: "to",
	alias: "-",
	autoload: true,
	unloadable: false,
	min_rank: 0,
	display: "say something out loud directed at someone",
	help: "Says something out loud, directed to a specific person",
	usage: [".sayto <user> <text>", ".to <user> <text>", "- <user> <text>"],

	execute: function(socket, command, command_access) {
		let chalk = require('chalk');
		let to = command.split(' ')[0];
		let message = command.split(' ').slice(1).join(' ');

		if ((typeof to === 'undefined') || (typeof message === 'undefined') || to.length < 1 || message.length < 1) {
			return command_access.sendData(socket, chalk.yellow(":: ") + "You have to use it this way:" + chalk.yellow(" .sayto <user> <text>\r\n"));
		}
		let possibleUsers = [];
		// there is a command_access.getAproxOnlineUser , but we're not just
		// seeing who's online, we're also seein who's on the same room. It
		// might make sense to turn this into an helper function in the future.
		if (command_access.getOnlineUser(to) !== false && JSON.stringify(command_access.getOnlineUser(to).db.where) === JSON.stringify(socket.db.where)) {
			// exact match
			possibleUsers = [command_access.getOnlineUser(to)];
		} else {
			// looking for aproximate matches
			for (let i = 0; i < command_access.sockets.length; i++) {
				if (
					command_access.sockets[i].loggedin
					&& JSON.stringify(command_access.sockets[i].db.where) === JSON.stringify(socket.db.where)
				) {
					if (
						to.toLowerCase() === command_access.sockets[i].username.toLowerCase().substr(0, to.length)
						&& (to.length <= command_access.sockets[i].username.length)
					) {
						possibleUsers.push(command_access.sockets[i]);
					}
				}
			}
		}

		// if there are various possibilities, let's exclude the one where the user might be trying to talk to themselves
		if (possibleUsers.length > 1) {
			possibleUsers = possibleUsers.filter(user => user.username.toLowerCase() !== socket.username.toLowerCase());
		}

		if (!possibleUsers.length) {
			return command_access.sendData(socket, chalk.red(":: ") + `You cannot see ${to}, so you cannot say anything to them!\r\n`);
		} else if (possibleUsers.length === 1) {
			if (socket.username.toLowerCase() === possibleUsers[0].username.toLowerCase()) {
				return command_access.sendData(socket, chalk.red(":: ") + "Talking to yourself is the first sign of madness.\r\n");
			}
			command_access.allHereButMe(socket, function(me,to){
				command_access.sendData(to, `${chalk.bold(me.username + ' says')} (to ${possibleUsers[0].username}): ${message} ~RS\r\n`);
			});
			command_access.sendData(socket, `${chalk.green('You say')} (to ${possibleUsers[0].username}): ${message} ~RS\r\n`);
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
