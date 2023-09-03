const { MYSQL_SAVE, MYSQL_GET_ALL, MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ONE,
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService } = require("../DB.js");
const { getSteamUserData } = require (`../../modules/stalker/requests.js`);
const { LogString, log } = require("../../tools/log.js");
const { getTimeMSKToStringFormat, getDiscordRelativeTime } = require('../../tools/time.js');
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../modules/tools.js");
const { SendAnswer } = require("../../tools/embed.js");

const { emoji_steam } = require("../../constantes/emojis.js");

const moduleName = `Stalker Steam`;

const STEAM_PERSONA_STATE = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'looking to trade', 'looking to play'];

module.exports = {

    MYSQL_STEAM_USER_TRACKING_CHANGE: async function(message, userid, option){
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('steamuser', {steamid: userid});
        if (userdata === null ) {
            var steamuserdata = await getSteamUserData([userid]);
            if (steamuserdata.length>0){
                steamuserdata = steamuserdata[0];
            } else {
                return {success: false, text: `Steam user **${userid}** not exists`}
            }
            steamuserdata.tracking = Boolean(option.value);
            await MYSQL_SAVE('steamuser', { steamid: steamuserdata.steamid }, steamuserdata);
            userdata = steamuserdata;
            
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'steamprofile', 'tracking', option.value, ['steamid', userdata.steamid], 'steamuser');
                break;
            default:
                throw new Error('unexpected error: undefined action');
        }
        return {success: true, text: `Steam user **${userid}** set **${option.action}** is **${option.value}**`}

    },

    STEAM_TRACKING_INFO: async function (message){
        var mysql_data = await getTrackingUsersForGuild(message.guild.id, 'steamprofile_tracking', 'steamuser');
        if (mysql_data.length > 0){
            let MessageFields = [];
            var usernamesFields = '';
            var useridsFields = '';
            for (let userdata of mysql_data){
                useridsFields += `${userdata.steamid.toString()}\n`;
                usernamesFields += `${userdata.username.toString()}\n`;
            }
            MessageFields.push ({name: 'User ID', value: useridsFields, inline: true});
            MessageFields.push ({name: 'Username', value: usernamesFields, inline: true});
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_steam} ${moduleName}`,
                text: `Tracking users info`,
                fields: MessageFields} );
        } else {
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_steam} ${moduleName}`,
                text: `No tracking users`} );
        }
    },

    checkChangesSteamUser: async function (stalkerEvents){
        try{
            
            var AllUsersSteamDataFromDB = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('steamuser', {tracking: true}));
    
            if (AllUsersSteamDataFromDB.length > 0){
                log('Проверка стим профилей', moduleName)
                var AllSteamUsersIDList = GET_VALUES_FROM_OBJECT_BY_KEY(AllUsersSteamDataFromDB, 'steamid')
                var AllUsersSteamData = await getSteamUserData(AllSteamUsersIDList);
                if (AllUsersSteamData.length == 0) {
                    return false
                }

                for (let steamDataOld of AllUsersSteamDataFromDB){
                    
                    let steamData = AllUsersSteamData.filter((val) => {
                        return val.steamid === steamDataOld.steamid
                    });
                    steamData = steamData[0];

                    if ( typeof steamData.tracking === 'undefined' || steamData.tracking === null){
                        steamData.tracking = true;
                    }                    
                
                    let steamChanges = {
                        isChanges: false,
                        username: steamData.username,
                        userid: steamDataOld.steamid,
                        text: `Профиль **[${steamData.username}](${steamData.url})** имеет новые изменения:\n`,
                    };
                
                    if (steamData.username !== steamDataOld.username){
                        steamChanges.text += `Смена ника с **${steamDataOld.username}** на **${steamData.username}**\n`;
                        steamChanges.isChanges = true;
                    }
                
                    if (steamData.onlinestate !== steamDataOld.onlinestate){
                        steamChanges.text += `Статус активности: **${STEAM_PERSONA_STATE[steamData.onlinestate]}**\n`;
                        if (steamData.lastactive !== 0){
                            steamChanges.text += `Последний вход: **${getTimeMSKToStringFormat(new Date(steamData.lastactive*1000))}** ${getDiscordRelativeTime(steamData.lastactive*1000)}\n`;
                        }
                        steamChanges.isChanges = true;
                    }
                
                    if (steamData.gameid !== 0){
                        steamChanges.text += `Играет в **${steamData.gameinfo!==''?steamData.gameinfo:'Неопределено' } (ID: ${steamData.gameid})**\n`;
                        steamChanges.isChanges = true;
                    }
    
                    if (steamData.gameid === 0 && steamDataOld.gameid !== 0){
                        steamChanges.text += `Больше не играет в **${steamDataOld.gameinfo!==''?steamDataOld.gameinfo:'Неопределено' } (ID: ${steamDataOld.gameid})**\n`;
                        steamChanges.isChanges = true;
                    }
                                
                    await MYSQL_SAVE('steamuser', {steamid: steamDataOld.steamid}, steamData);
                
                    if (steamChanges.isChanges){
                        steamChanges.guildids = await getGuildidsOfTrackingUserService('steamprofile_tracking', steamDataOld.steamid);
                        stalkerEvents.emit('steamUserProfileChanges', steamChanges);
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },
}