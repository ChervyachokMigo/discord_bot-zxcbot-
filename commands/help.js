const { getCommandInfo, getAvailableAliasesCommands } = require(`../modules/commands.js`);
const { SendAnswer, SendError } = require("../tools/embed.js");

module.exports = {
    command_name: `Help`, 
    command_description: `Показывает все команды.`,
    command_aliases: [`help`, `commands`],
    command_help: `help [command]`,
    action: async (comargs, message)=>{
        var commandname = comargs.shift();
        if (commandname == undefined){
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${module.exports.command_name}`,
                text: `Доступные команды:\n${getAvailableAliasesCommands()}`} );
            return
        }
        var commandDesc = getCommandInfo(commandname);
        if (commandDesc == undefined){
            await SendError(message, 
                {name: module.exports.command_name, help: module.exports.command_help }, 
                `Нет такой команды`);
            return
        }

        await SendAnswer( {channel:  message.channel,
            guildname: message.guild.name,
            messagetype: `info`,
            title: `${module.exports.command_name}`,
            text: `${commandDesc}`} );
        
    }
}