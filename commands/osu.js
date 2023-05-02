const { modules } = require (`../settings.js`);
const { getStringBetweenQuotes, getBooleanFromString } = require(`../modules/tools.js`);
const { SendAnswer, SendError } = require("../tools/embed.js");

const { MYSQL_OSU_USER_TRACKING_CHANGE, OSU_TRACKING_INFO } = require (`../modules/stalker/osu.js`);

const { emoji_osu } = require("../constantes/emojis.js");

const { getOsuUserInfoByCommand } = require (`../modules/stalker/osu.js`);

module.exports = {
    command_name: `Osu`,
    command_description: `Управление осу модулем.`,
    command_aliases: [`osu`],
    command_help: `[stalker] osu user Username(User ID)\n[stalker] osu tracking[_info] [Username(User ID)] [<value>]`,
    action: async (comargs, message)=>{
        if (modules.stalker){
            if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
                await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${message.author.username}, у Вас нет прав для этого действия.`);
                return
            }
    
            var comaction = comargs.shift();
            switch (comaction){
                case 'user':
                    await getOsuUserInfoByCommand(comargs, message, {name: module.exports.command_name,
                        help: module.exports.command_help });
                    break;
                case 'tracking_info':
                    await OSU_TRACKING_INFO(message);
                    break;
                case 'tracking': 
                    if (comargs.length == 0){
                        await OSU_TRACKING_INFO(message);
                        break;
                    };
                    var trackingOption = getBooleanFromString(comargs.pop());
                    if (typeof trackingOption === 'undefined'){
                        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неверная опция трекинга. Должно быть 1 или 0`);
                        return    
                    }
                    var userid = getStringBetweenQuotes(comargs.join(" "));
                    if (userid.length > 0 ){
                        userid = userid[0];
                    } else {
                        userid = comargs.shift();
                    }
                    if (typeof userid === 'undefined'){
                        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Напишите id пользователя`);
                        return    
                    }
                    
                    let result = await MYSQL_OSU_USER_TRACKING_CHANGE(message, userid, {action: 'tracking', value: trackingOption});
                    if (result.success){
                        await SendAnswer( {channel:  message.channel,
                            guildname: message.guild.name,
                            messagetype: `info`,
                            title: `${emoji_osu} ${module.exports.command_name}`,
                            text: `${result.text}`} );
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
