exports.command = {
	name: "2faadmin",
	alias: "",
	autoload: true,
	unloadable: true,
	min_rank: 7,
	display: "Manages 2 factor authentication for users",
    help: "To reset 2FA configuration for a user:  .2faadmin resetuser <username>\r\n" +
          "To burn a backup code for a user:       .2faadmin burnbackupcode <username>\r\n" +
          "To return the general 2FA stats:        .2faadmin status\r\n" +
          "To return the 2FA status for a user:    .2faadmin status <username>",
	usage: ".2faadmin <resetuser <username>|burnbackupcode <username>|status [<username>]>",
	weigth: 10,

	// Function to execute the command
	execute: function(socket, command, command_access) {
        var chalk = require('chalk');        
        var operation = command.split(' ')[0];
        var argument = command.split(' ')[1];
        switch(operation)
        {
            case 'resetuser':
                if(typeof argument !== 'undefined')     {
                    var userRecord = command_access.getUser(argument);
                    if(typeof userRecord !== 'undefined') {
                        delete userRecord.auth2fa_status;
                        delete userRecord.auth2fa_secretKey;
                        delete userRecord.auth2fa_backupCode;
                        command_access.updateUser(argument, socket.db);
                        command_access.sendData(socket, "2FA configuration for user " + chalk.bold(argument) + " has been resetted.\r\n");
                    } else {
                        command_access.sendData(socket, "Username not found!\r\n");
                    }
                } else {
                    command_access.sendData(socket, "Please provide a username!\r\n");
                }
                break;
            case 'burnbackupcode':
                if(typeof argument !== 'undefined') {
                    var userRecord = command_access.getUser(argument);
                    if(typeof userRecord !== 'undefined') {
                        if(typeof userRecord.auth2fa_backupCode !== 'undefined')
                        {
                            if(userRecord.auth2fa_backupCode.substr(0,1) !== '!') {
                                command_access.auth2faBurnBackupCode(argument);
                                command_access.sendData(socket, "Backup code for user " + chalk.bold(argument) + " has been burned. User will need to generate a new one.\r\n");
                            } else {
                                command_access.sendData(socket, "Backup code for user " + chalk.bold(argument) + " is already burned.\r\n");
                            }
                        } else {
                            command_access.sendData(socket, "User "+ argument +" does not have a backup code! (2FA disabled or enrollment not completed)\r\n");
                        }
                    } else {
                        command_access.sendData(socket, "Username not found!\r\n");
                    }
                } else {
                    command_access.sendData(socket, "Please provide a username!\r\n");
                }
                break;
            case 'status':
                if(typeof argument === 'undefined') { // general status
                    var userList = command_access.getUsersList();
                    var countEnabled = 0, countDisabled = 0, countEnrolling = 0, countBurnedBackupCode = 0;
                    for (let index = 0; index < userList.length; index++) {
                        var userRecord = command_access.getUser(userList[index].username);
                        if(typeof userRecord.auth2fa_status === 'undefined') {
                            countDisabled++;
                        } else if(userRecord.auth2fa_status) {
                            countEnabled++;
                            if(userRecord.auth2fa_backupCode.substr(0,1) === '!') {
                                countBurnedBackupCode++;
                            }
                        } else {
                            countEnrolling++;
                        }
                    }
                    command_access.sendData(socket, chalk.green("User accounts with 2FA enabled           : " + countEnabled + "\r\n"));
                    command_access.sendData(socket, chalk.yellow("User accounts with 2FA ongoing enrollment: " + countEnrolling + "\r\n"));
                    command_access.sendData(socket, chalk.red("User accounts with burned backup codes   : " + countBurnedBackupCode + "\r\n"));
                    command_access.sendData(socket, chalk.blueBright("User accounts with 2FA disabled          : " + countDisabled + "\r\n"));
                } else { // user status
                    var userRecord = command_access.getUser(argument);
                    if(typeof userRecord !== 'undefined') {
                        if(typeof userRecord.auth2fa_status !== 'undefined') {
                            if(userRecord.auth2fa_status) {
                                command_access.sendData(socket, "2 factor authentication " + chalk.bold("is enabled") + " for user " + argument + "\r\n");
                                if(userRecord.auth2fa_backupCode.substr(0,1) === '!') {
                                    command_access.sendData(socket, chalk.red("Backup code for user " + argument + " is burned!\r\n"));
                                }
                            } else {
                                command_access.sendData(socket, "2 factor authentication is in " + chalk.bold("enrollment process") + " for user " + argument + "\r\n");
                            }
                        } else {
                            command_access.sendData(socket, "2 factor authentication is " + chalk.bold("not enabled") + " for user " + argument + "\r\n");                            
                        }
                    } else {
                        command_access.sendData(socket, "Username not found!\r\n");
                    }
                }
                break;            
            default:
                command_access.sendData(socket, "Invalid operation for ." + this.name + ". Check syntax using .help 2faadmin\r\n");
        }
	}
}