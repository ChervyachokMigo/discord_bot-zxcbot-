const fs = require('fs');
var AvailableCommands = [];

module.exports = {
    initAvailableCommands: function(){
        let command_files = fs.readdirSync(`./commands`, {encoding:'utf-8'});
        for (let command_file of command_files){
            let { command_aliases, command_description, command_name, command_help } = require(`../commands/${command_file}`);
            AvailableCommands.push({
                filename: command_file,
                name: command_name,
                desc: command_description,
                alias: command_aliases,
                help: command_help
            });
        }
    },
    getAvailableCommands: function (){
        return AvailableCommands;
    },

    getAvailableAliasesCommands: function(){
        var text = [];
        for (let command of AvailableCommands){
            text.push(command.alias.join(', '))
        }
        return text.join(', ')
    },
    
    getCommandInfo: function (commandname){
        var text = undefined;
        
        for (let command of AvailableCommands){
            if (command.alias.includes(commandname)){
                text = `Команда: **${command.name}**\n`+
                    `Синонимы: \`${command.alias.join(', ')}\`\n`+
                    `Описание: ${command.desc}\n`+
                    `Пример: \`${command.help}\`\n\n`;
                break;
            }
            
        }
        
        return text;
    }
}
