const { modules } = require (`../settings.js`);

const { SendAnswer, SendError } = require("../tools/embed.js");
const { getDiscordRelativeTime } = require('../tools/time.js');
const { getGuildChannelDB } = require (`../modules/GuildChannel.js`);

const { emoji_twitch } = require("../constantes/emojis.js");
const { stalkerClipsCheckLastDays, twitchclipsTitleMinChars } = require('../settings.js');

const { MYSQL_GET_TRACKING_DATA_BY_ACTION } = require("../modules/DB.js");

const { LogString, log } = require("../tools/log.js");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../modules/tools.js");

const { getLastTwitchClips , getTwitchUserID } = require (`../modules/stalker/requests.js`);

const { DownloadClip } = require (`../modules/stalker/records.js`);
const { MYSQL_SAVE } = require("mysql-tools");

module.exports = {
    command_name: `Twitch Clips`,
    command_description: `Проверка клипов твича юзера.`,
    command_aliases: [`twitchclips`],
    command_help: `twitchclips type(new, last) username [lastdays]`,
    action: async (comargs, message)=>{
        try{
            if (modules.stalker){
                if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${message.author.username}, у Вас нет прав для этого действия.`);
                    return
                }
                var comtype = comargs.shift();
                if (typeof comtype === 'undefined' ){
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Напишите тип команды`);
                    return   
                }

                if (comtype !== 'new' && comtype !== 'last'){
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неверный тип команды`);
                    return 
                }

                var comusername = comargs.shift();
                if (typeof comusername === 'undefined'){
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Напишите имя пользователя`);
                    return    
                }

                var comdays = Number(comargs.shift());
                if (typeof comdays === 'undefined' || isNaN(comdays) == true){
                    comdays = stalkerClipsCheckLastDays;
                }
                
                var userid = 0;
                try{
                    userid = await getTwitchUserID(comusername);
                } catch (e){
                    userid = 0;
                }

                if (userid == 0){
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Пользователя **${comusername}** не существует`);
                }
                                
                let newclips_data = await getLastTwitchClips(userid, comdays);
                if ( newclips_data == -1 ) {
                    log('невозможно получить данные',  module.exports.command_name);
                    return
                }                  
                
                if (comtype === 'new'){
                    //получаем все клипы пользователя и преобразовываем в обычный массив объектов
                    let clips_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('twitchclips', { userid: userid } );
                                
                    if ( clips_data.length > 0 ){
                        //преобразовываем список в массив с айди клипов
                        var clipIDs = GET_VALUES_FROM_OBJECT_BY_KEY(clips_data, 'clipid');
                        //сравнение id клипов
                        //если клипа нет в базе - он новый
                        var newclips = newclips_data.filter( (val)=>{
                            return clipIDs.indexOf(val.id) == -1
                        } );
                    } else {
                        var newclips = newclips_data;
                    }
                } else {
                    var newclips = newclips_data;
                }

                //если найдены новые клипы
                //сохраняем их в базу и отправляем сообщение
                if ( newclips.length > 0 ){
                    for ( let clipdata of newclips ){   
                        if (comtype === 'new'){
                            await DownloadClip(clipdata, 'twitch');
                            await anounceNewClip(message, clipdata);
                            await MYSQL_SAVE( 'twitchclips', { clipid: clipdata.id, userid: userid });
                        }
                    }
                    if (comtype === 'last'){
                        await anounceClipsList(message, newclips);
                    }
                } else {
                    await SendAnswer( {channel: message.channel,
                        guildname: message.guild.name,
                        messagetype: `info`,
                        title: `${emoji_twitch} Stalker Twitch Clips`,
                        text:  `На канале **${comusername}** нет новых клипов` } );
                }

            }
        } catch (e) {
            await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, e);
            console.log(e)
        }
    }
}

function makeClipsList(clips, MessageFields = [], first = true){
    var linksFields = '';
    var usernamesFields = '';
    var dateFields = '';
    var newClipsData = [];
    for ( let clip of clips ){
        if (clip.title.length>twitchclipsTitleMinChars){
            clip.title = `${clip.title.substr(0,twitchclipsTitleMinChars)}...`;
        }
        let nextLinksFields = linksFields + `[${clip.title}](${clip.url})\n`;
        if (nextLinksFields.length < 1024){
            linksFields += `[${clip.title}](${clip.url})\n`;
            usernamesFields += `${clip.creator_name}\n`;
            dateFields += `${getDiscordRelativeTime( clip.created_at )}\n`;
        } else {
            newClipsData.push (clip);
        }
    }
    if (first == true){
        MessageFields.push ({name: 'Title', value: linksFields, inline: true});
        MessageFields.push ({name: 'Creator', value: usernamesFields, inline: true});
        MessageFields.push ({name: 'Date', value: dateFields, inline: true});
    } else {
        MessageFields.push ({name: '** **', value: linksFields, inline: true});
        MessageFields.push ({name: '** **', value: usernamesFields, inline: true});
        MessageFields.push ({name: '** **', value: dateFields, inline: true});
    }
    
    if (newClipsData.length>0){
        makeClipsList(newClipsData, MessageFields, false);
    }
    return MessageFields;
}

async function anounceClipsList(message, clips){
    var MessageFields = makeClipsList(clips);
    await SendAnswer( {channel:  message.channel,
        guildname: message.guild.name,
        messagetype: `info`,
        title: `${emoji_twitch} Twitch Clips`,
        text: `Last Twitch Clips`,
        fields: MessageFields} );
}

async function anounceNewClip(message, clipdata){
    if (clipdata.broadcaster_name === 'talalusha'){
        var channel = await getGuildChannelDB( message.guild, 'talala_twitchclips' );
    } else {
        var channel = await getGuildChannelDB(  message.guild, 'twitchclips' );
    }
    var text = `На канале **${clipdata.broadcaster_name}** появился [новый клип](${clipdata.url})\n`;
    text += `Название: **${clipdata.title}**\n`;
    text += `Создатель: **${clipdata.creator_name}**\n`;
    text += `Дата: ${getDiscordRelativeTime( clipdata.created_at )}\n`;
    
    await SendAnswer( {channel: channel,
        guildname:  message.guild.name,
        messagetype: `info`,
        title: `${emoji_twitch} Stalker Twitch Clips`,
        text:  text } );
    LogString(message.guild.name,`info`, `Stalker Twitch Clips`,`у ${clipdata.broadcaster_name} новый клип на Twitch!`);
    
}
