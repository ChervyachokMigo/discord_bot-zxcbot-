const { available_guildSettings } = require (`../settings.js`);
const { SendAnswer, SendError } = require("../tools/embed.js");
const { changeGuildSetting } = require('../modules/guildSettings.js');

module.exports = {
    command_name: `Guild Settings`, 
    command_description: `Активирует или деактивирует какую-то настройку бота.`,
    command_aliases: [`set`,`guildsetting`,`setting`],
    command_help: `guildsetting settingname value`,
    action: async (comargs, message)=>{
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
            await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${message.author.username}, у Вас нет прав управлять настройками.`);
            return
        }

        const settingname = comargs.shift();
        if(settingname == undefined || settingname.length==0){
            await SendError(message, {name: module.exports.command_name,
                help: module.exports.command_help }, 'Напишите название настройки')
            return false;
        }
        const settingvalue = comargs.shift();
        if(settingvalue == undefined || settingvalue.length==0){
            await SendError(message, {name: module.exports.command_name,
                help: module.exports.command_help }, 'Напишите значение настройки')
            return false;
        }

        if (!available_guildSettings.includes(settingname)){
            await SendError(message, {name: module.exports.command_name,
                help: module.exports.command_help }, 'Недоступная настройка')
            return false;
        }

        await changeGuildSetting(message.guild.id, settingname, settingvalue);

        await SendAnswer( {channel:  message.channel,
            guildname: message.guild.name,
            messagetype: `info`,
            title: `${module.exports.command_name}`,
            text: `Настройка назначена`} );
        return true;
    }
}