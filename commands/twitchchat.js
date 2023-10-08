const { modules } = require (`../settings.js`);

const { getStringBetweenQuotes, getBooleanFromString } = require(`../modules/tools.js`);
const { SendAnswer, SendError } = require("../tools/embed.js");

const { MYSQL_TWITCH_CHAT_TRACKING_CHANGE, TWITCHCHAT_TRACKING_INFO } = require (`../modules/DB.js`);

const { emoji_twitch } = require("../constantes/emojis.js");

module.exports = {
    command_name: `Twitchchat`,
    command_description: `Управление модулем чата твича.`,
    command_aliases: [`twitchchat`],
    command_help: `[stalker] twitchchat user Username\n[stalker] twitchchat tracking[_info] [Username] [<value>]`,
    action: async (comargs, message)=>{
        if (modules.stalker){
            if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
                await SendError(message, {
                    name: module.exports.command_name, 
                    help: module.exports.command_help 
                }, `${message.author.username}, у Вас нет прав для этого действия.`);
                return
            }
            var comaction = comargs.shift();
            switch (comaction){
                case 'tracking_info':
                    await TWITCHCHAT_TRACKING_INFO(message);
                    break;
                case 'tracking': 
                    if (comargs.length == 0){
                        await TWITCHCHAT_TRACKING_INFO(message);
                        break;
                    };
                    var trackingOption = getBooleanFromString(comargs.pop());
                    if (typeof trackingOption === 'undefined'){
                        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неверная опция трекинга. Должно быть 1 или 0`);
                        return    
                    }

                    var username = getStringBetweenQuotes(comargs.join(" "));
                    if (username.length > 0 ){
                        username = username[0];
                    } else {
                        username = comargs.shift();
                    }

                    if (typeof username === 'undefined'){
                        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Напишите имя пользователя`);
                        return    
                    }

                    let result = await MYSQL_TWITCH_CHAT_TRACKING_CHANGE (message, username, {action: comaction, value: trackingOption});
                    if (result.success){
                        await SendAnswer({
                            channel:  message.channel,
                            guildname: message.guild.name,
                            messagetype: `info`,
                            title: `${emoji_twitch} ${module.exports.command_name}`,
                            text: `${result.text}`
                        });
                    } else {
                        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${result.text}`);  
                    }
                    break;
                default:
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неправильное действие`);   
                    return    
            }
        }
    }
}