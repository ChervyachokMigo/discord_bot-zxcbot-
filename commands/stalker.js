const { modules } = require (`../settings.js`);
const { SendError } = require("../tools/embed.js");

const { TWITCH_TRACKING_INFO } = require (`../modules/stalker/twitch.js`);
const { TROVO_TRACKING_INFO } = require (`../modules/stalker/trovo.js`);
const { STEAM_TRACKING_INFO } = require (`../modules/stalker/steam.js`);
const { VK_TRACKING_INFO } = require (`../modules/stalker/VK.js`);
const { TWITCHCHAT_TRACKING_INFO } = require (`../modules/DB.js`);
const { OSU_TRACKING_INFO } = require (`../modules/stalker/osu.js`);
const { YOUTUBE_TRACKING_INFO } = require (`../modules/stalker/youtube.js`);

module.exports = {
    command_name: `Stalker`,
    command_description: `Модуль объединяющий остальные модули-собиратели информации о каналах на различных сервисах.`,
    command_aliases: [`stalker`],
    command_help: `stalker service action value\nstalker all tracking`,
    action: async (comargs, message)=>{
        try{
        if (modules.stalker){
            if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
                await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${message.author.username}, у Вас нет прав для этого действия.`);
                return false;
            }
            var comtype = comargs.shift();
            var comaction = comargs.shift();
            switch (comtype){
                case 'all':
                    switch (comaction){
                        case 'tracking_info':
                        case 'tracking':
                            await YOUTUBE_TRACKING_INFO(message);
                            await TWITCH_TRACKING_INFO(message);
                            await TROVO_TRACKING_INFO(message);
                            await VK_TRACKING_INFO(message);
                            await STEAM_TRACKING_INFO(message);
                            await TWITCHCHAT_TRACKING_INFO(message);
                            await OSU_TRACKING_INFO(message);
                            break;
                        default:
                            await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неправильное действие`);   
                            return false;
                    }
                    break
                case 'twitch': 
                    await require('./twitch.js').action(comargs, message);
                    break;
                case 'trovo':
                    await require('./trovo.js').action(comargs, message);
                    break;
                case 'vk': 
                    await require('./vk.js').action(comargs, message);
                    break;   
                case 'steam': 
                    await require('./steam.js').action(comargs, message);
                    break;   
                case 'twitchchat':
                    await require('./twitchchat.js').action(comargs, message);
                    break;
                case 'osu': 
                    await require('./osu.js').action(comargs, message);
                    break;
                case 'youtube':
                    await require('./youtube.js').action(comargs, message);
                    break;
                default:
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неправильный тип действия`);
                    return false;
            }
        }
        } catch (e) {
            await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, e);
        }
    }
}

