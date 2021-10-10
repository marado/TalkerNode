const chalk = require("chalk");
exports.command = {
	name: "color",
	aka: "colour",
	autoload: true,
	unloadable: false,
	min_rank: 1,
	display: "toggle colors on or off, for you",
	help: "Toggles colors on or off, for you",
	usage: [".color", ".color list"],


	execute: function(socket, command, command_access) {
		var chalk = require('chalk');
		var list = command.split(' ')[0];

		// set the colour if we don't have a list option
		if (list === 'undefined' || list.length < 1 || list !== 'list') {
			if (typeof socket.db.color === 'undefined') {
				// By default color is turned on, so we're now turning it off:
				socket.db.color = false;
			} else {
				socket.db.color = !(socket.db.color);
			}
			command_access.updateUser(socket.username, socket.db);
			command_access.sendData(socket, chalk.green("[::] ") + "You have the color setting: " + socket.db.color + "\r\n");
			return;
		}

		const colorCodes = [
			"~OL", "~UL", "~LI", "~RV",
			"~FK", "~FR", "~FG", "~FY", "~FB", "~FM", "~FC", "~FW",
			"~BK", "~BR", "~BG", "~BY", "~BB", "~BM", "~BC", "~BW",
			"~RS"
		];

		colorCodes.forEach(code => {
			command_access.sendData(socket, `^${code}: ${code}TalkerNode, version ${command_access.version}~RS\r\n`);
		});
		command_access.sendData(socket, "\r\n");

		for (let i = 0; i < 256; i++) {
			let code = '~F' + i;
			let pad = i < 10 ? 2 : (i < 100 ? 1 : 0);
			command_access.sendData(socket, code + ' ^' + code + `${' '.repeat(pad)} ~RS`);
			if ((i+1) % 16 === 0) {
				command_access.sendData(socket, "\r\n");
			}
		}
		command_access.sendData(socket, "\r\n");

		for (let i = 0; i < 256; i++) {
			let code = '~B' + i;
			let pad = i < 10 ? 2 : (i < 100 ? 1 : 0);
			command_access.sendData(socket, code + ' ^' + code + `${' '.repeat(pad)} ~RS`);
			if ((i+1) % 16 === 0) {
				command_access.sendData(socket, "\r\n");
			}
		}
		command_access.sendData(socket, "\r\n");


	}
}
