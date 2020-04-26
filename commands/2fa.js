exports.command = {
	name: "2fa",
	alias: "",
	autoload: true,
	unloadable: true,
	min_rank: 2,
	display: "Manages 2 factor authentication for your account",
    help: "To enroll your account for 2FA:      .2fa enroll   +   .2fa verify <token>\r\n" +
		"To generate a new backup code:       .2fa newbackupcode\r\n" +
        "To check your account 2FA status:    .2fa status\r\n" +
        "To disable 2FA for your account:     .2fa disable <token>\r\n\r\n" +
        "For more detailed help use .2fa help",
	usage: ".2fa <help|enroll|verify <token>|disable <token>|newbackupcode|status>",
	weigth: 0,

    // returns secret key or backup code in a friendly easy-to-read format
    formatFriendlyKeyString: function(keyString) {
        return keyString.match(/.{1,4}/g).join('-')
    },

    // outputs command extended help with information on 2fa enrollment procedure
    outputDetailedHelp: function(socket, command_access) {
        var chalk = require('chalk');

        command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));
        command_access.sendData(socket, "  Detailed help for ." + this.name + " command\r\n");
        command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));
        command_access.sendData(socket, "  1. Enrolling into 2 factor authentication on " + chalk.bold(command_access.talkername) + "\r\n\r\n");
        command_access.sendData(socket, "     Enrollment starts by using " + chalk.yellow(chalk.bold("." + this.name + " enroll")) + " command.\r\n\r\n");
        command_access.sendData(socket, "     This command will generate a secret key that you will need to configure\r\n");
        command_access.sendData(socket, "     on your soft token software, to generate a token to authenticate. Check\r\n");
        command_access.sendData(socket, "     https://en.wikipedia.org/wiki/Google_Authenticator#Other_authentication_software\r\n");
        command_access.sendData(socket, "     for a list of soft woken software you can use for this purpose.\r\n\r\n");
        command_access.sendData(socket, "     After configuring your soft token software with the generated secret key\r\n");
        command_access.sendData(socket, "     you need to confirm that it's generating correct tokens, by using the\r\n");
        command_access.sendData(socket, "     following command: " + chalk.yellow(chalk.bold("." + this.name + " verify <token>")) + "\r\n\r\n");
        command_access.sendData(socket, "     This command will certify that your 2FA software is properly configured\r\n");
        command_access.sendData(socket, "     and will enable 2FA for your account. It will also generate a backup code\r\n");
        command_access.sendData(socket, "     which you can use if you are unable to authenticate using 2FA. Using this\r\n");
        command_access.sendData(socket, "     backup code will require generating a new one using " + chalk.yellow(chalk.bold("." + this.name + " newbackupcode")) + "\r\n\r\n");
        command_access.sendData(socket, "  2. Checking 2FA status for your user account\r\n\r\n");
        command_access.sendData(socket, "     To check the status of 2FA for your account use " + chalk.yellow(chalk.bold("." + this.name + " status")) + "\r\n\r\n");
        command_access.sendData(socket, "  3. Disable 2 factor authentication\r\n\r\n");
        command_access.sendData(socket, "     You can disable 2FA at any time by using " + chalk.yellow(chalk.bold("." + this.name + " disable <token|backup_code>")) + "\r\n");
        command_access.sendData(socket, "     To reenable it on your account you will be required to enroll again\r\n");
        command_access.sendData(socket, chalk.blue("+-----------------------------------------------------------------------------+\r\n"));
	},

	// Function to execute the command
	execute: function(socket, command, command_access) {
        var chalk = require('chalk');        
        var operation = command.split(' ')[0];
        var token = command.split(' ')[1];
        switch(operation)
        {
            case 'enroll':          // starts 2fa enrollment (generates secret key and waits for token verification)
                if(socket.db.auth2fa_status)
                {
                    command_access.sendData(socket, "2 factor authentication is already enabled for your account!\r\n");
                    command_access.sendData(socket, "If you really want to start the enrollment procedure please disable 2FA first.\r\n");
                } else {
                    if(typeof socket.db.auth2fa_status === 'undefined')
                    {
                        // start enrollment
                        var newSecretKey = command_access.auth2faGenerateSecretKey();
                        socket.db.auth2fa_secretKey = newSecretKey;
                        socket.db.auth2fa_status = false;
                        command_access.sendData(socket, "Your secret key is:  " + chalk.yellow(chalk.bold(this.formatFriendlyKeyString(newSecretKey))) + "\r\n");
                        command_access.sendData(socket, "Please add it to your soft token software (just the letters, the dashes are for\r\n");
                        command_access.sendData(socket, "easy reading), and then verify the configuration using " + chalk.yellow(chalk.bold("." + this.name + " verify <token>")) + "\r\n");
                        command_access.sendData(socket, "to complete enrollment.\r\n");
                        command_access.updateUser(socket.username, socket.db);

                    } else {    // enrollment is already ongoing and expects token verification
                        command_access.sendData(socket, "2 factor authentication enrollment is already taking place for your account!\r\n");
                        command_access.sendData(socket, "Either complete token verification with " + chalk.yellow(chalk.bold("." + this.name + " verify <token>")) + " or disable 2FA.\r\n");
                    }
                }
                break;
            case 'verify':          // closes 2fa enrollment (verifies token, generates backup code and sets account configuration)
                if(socket.db.auth2fa_status)
                {
                    command_access.sendData(socket, "2 factor authentication is already enabled for your account!\r\n");
                    command_access.sendData(socket, "If you really want to start the enrollment procedure please disable 2FA first.\r\n");
                } else {
                    if(typeof socket.db.auth2fa_status === 'undefined')
                    {
                        // enrollment has not yet been started
                        command_access.sendData(socket, "2 factor authentication enrollment has not been started for your account!\r\n");
                        command_access.sendData(socket, "To begin enrollment use " + chalk.yellow(chalk.bold("." + this.name + " enroll")) + ".\r\n");
                    } else {    // verify 2fa configuration and enable it for the account
                        if(typeof token !== 'undefined' && token.length == 6)
                        {
                            if(command_access.auth2faValidateOTP(socket.username,token))
                            {   // token is valid; enable 2FA for the account
                                var newBackupCode = command_access.auth2faGenerateSecretKey();
                                socket.db.auth2fa_backupCode = newBackupCode;
                                socket.db.auth2fa_status = true;
                                command_access.updateUser(socket.username, socket.db);
                                command_access.sendData(socket, "Your token has been validated. Your account is now enabled for 2FA.\r\n");
                                command_access.sendData(socket, "This is your backup code which you can use to login if you are unable to \r\n");
                                command_access.sendData(socket, "use 2FA during login:  >>>>  " + chalk.yellow(chalk.bold(this.formatFriendlyKeyString(newBackupCode))) + "  <<<<\r\n");
                                command_access.sendData(socket, "Once you use your backup code you will need to generate a new one using.\r\n");
                                command_access.sendData(socket, chalk.yellow(chalk.bold("." + this.name + " newbackupcode") + "\r\n"));
                            } else {
                                command_access.sendData(socket, chalk.red("Your token failed validation!\r\n"));
                                command_access.sendData(socket, "Please provide a valid token generated from your secret key!\r\n");
                                command_access.sendData(socket, "If you wish to restart the enrollment process please use " + chalk.yellow(chalk.bold("." + this.name + " disable")) + "\r\n");
                            }
                        } else {
                            command_access.sendData(socket, "Please provide a valid token generated from your secret key!\r\n");
                        }
                    }
                }
                break;
            case 'disable':         // disables 2FA when enrollment has taken place
                if(typeof socket.db.auth2fa_status !== 'undefined')
                {   // 2FA is enabled or in the enrollment process
                    var continueDisable = false;
                    if(socket.db.auth2fa_status)
                    {
                        if(typeof token !== 'undefined' && command_access.auth2faValidateOTP(socket.username,token))
                        {
                            continueDisable = true;
                            command_access.sendData(socket, "2 factor authentication has been disabled for your account.\r\n");
                        } else {
                            continueDisable = false;
                            command_access.sendData(socket, "Invalid token!\r\n");
                        }
                    } else {
                        continueDisable = true;
                        command_access.sendData(socket, "2 factor authentication enrollment process has been canceled.\r\n");
                    }
                    if(continueDisable)
                    {
                        delete socket.db.auth2fa_status;
                        delete socket.db.auth2fa_secretKey;
                        delete socket.db.auth2fa_backupCode;
                        command_access.updateUser(socket.username, socket.db);
                    }
                } else {
                        command_access.sendData(socket, "You don't have 2 factor authentication enabled for your account!\r\n");
                }
                break;
            case 'newbackupcode':   // generates a new backup code
                if(socket.db.auth2fa_status)
                {
                    var newBackupCode = command_access.auth2faGenerateSecretKey();
                    socket.db.auth2fa_backupCode = newBackupCode;
                    command_access.sendData(socket, "Your new backup code is:  >>>>  " + chalk.yellow(chalk.bold(this.formatFriendlyKeyString(newBackupCode))) + "  <<<<\r\n");
                    command_access.updateUser(socket.username, socket.db);
                } else {
                    command_access.sendData(socket, "You don't have 2 factor authentication enabled for your account!\r\n");
                }
                break;
            case 'status':          // queries 2fa configuration state
                command_access.sendData(socket, "+----------------------------------------------------------------------------+\r\n");
                if(typeof socket.db.auth2fa_status != 'undefined')  // 2FA is not configured
                {
                    if(socket.db.auth2fa_status) { // enabled
                        command_access.sendData(socket, ("+ 2 factor authentication " + chalk.bold("is enabled") + " for your account").padEnd(77) + "+ \r\n");
                    } else { // enrolling
                        command_access.sendData(socket, ("+ " + chalk.yellow("You are currently enrolling into 2FA")).padEnd(77) + "+\r\n");
                        command_access.sendData(socket, ("+ Next step: verify soft token configuration using " + chalk.bold("." + this.name + " verify <token>")).padEnd(77) + "+\r\n");
                        command_access.sendData(socket, ("+ For further help use " + chalk.bold("." + this.name + " help")).padEnd(77) + "+\r\n");
                    }
                } else {
                    command_access.sendData(socket, ("+ 2 factor authentication is " + chalk.bold("not enabled") + " for your account").padEnd(77) + "+\r\n");
                }
                command_access.sendData(socket, "+----------------------------------------------------------------------------+\r\n");
                break;
            default:    // handles help command too
                this.outputDetailedHelp(socket, command_access);
        }
	}
}