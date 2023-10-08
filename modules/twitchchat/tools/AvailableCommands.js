const {readdirSync} = require('fs');
const { log } = require('../../../tools/log');

this.commands = [];

module.exports = {
    loadTwitchChatCommands: () => {
        log('Загрузка доступных комманд', 'Twitch Commands');
        const command_files = readdirSync(`modules/twitchchat/commands`, {encoding:'utf-8'});
    
        this.commands = [];

        for (const command_file of command_files){
            log('Загрузка команды: ' + command_file ,'Twitch Commands');
            const { command_aliases, command_description, command_name, command_help, command_permission } = require(`../commands/${command_file}`);

            this.commands.push({
                filename: command_file,
                name: command_name,
                desc: command_description,
                alias: command_aliases,
                help: command_help,
                permission: command_permission
            });
        }

    },

    runCommand: async (requested_command, args) => {
        for (const command of this.commands){
            if (command.alias.includes(requested_command)){
                if (args.user_permission <= command.permission){
                    return (await (require(`../commands/${command.filename}`)).action(args));
                } else {
                    return {permission: `Запрещено выполнить команду`}
                }
            }
        }
        return false; 
    },

    viewCommands: () => {
        console.log(this.commands);
    }
}