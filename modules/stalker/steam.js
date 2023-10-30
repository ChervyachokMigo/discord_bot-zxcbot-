const {  MYSQL_GET_TRACKING_DATA_BY_ACTION, manageGuildServiceTracking, getTrackingInfo, 
    getGuildidsOfTrackingUserService } = require("../DB.js");

const { MYSQL_SAVE, MYSQL_GET_ONE } = require("../DB/base.js");
const { getSteamUserData } = require (`../../modules/stalker/requests.js`);
const { LogString, log } = require("../../tools/log.js");
const { getTimeMSKToStringFormat, getDiscordRelativeTime } = require('../../tools/time.js');
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../modules/tools.js");

const { emoji_steam } = require("../../constantes/emojis.js");

const moduleName = `Stalker Steam`;

const STEAM_PERSONA_STATE = ['Offline', 'Online', 'Busy', 'Away', 'Snooze', 'looking to trade', 'looking to play'];

module.exports = {

    MYSQL_STEAM_USER_TRACKING_CHANGE: async function(message, userid, option){
        const user = isNaN( Number(userid))?{username: userid.toString()}:{steamid: userid};
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('steamuser', user);
        if (userdata === null ) {
            userdata = await getSteamUserData(user).shift();
            if (typeof userdata === 'undefined'){
                return {success: false, text: `Steam user **${userid}** not exists`}
            }
            userdata.tracking = Boolean(option.value);
            await MYSQL_SAVE('steamuser', { steamid: userdata.steamid }, userdata);
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
        const fieldsMapping = [
            { name: 'User ID', key: 'steamid' },
            { name: 'Username', key: 'username' },
        ];
        await getTrackingInfo(message, 'steamuser', 'steamprofile', emoji_steam, moduleName, fieldsMapping);
    },

    checkChangesSteamUser: async function (stalkerEvents){
        try{
            
            var AllUsersSteamDataFromDB = await MYSQL_GET_TRACKING_DATA_BY_ACTION('steamuser');
    
            if (AllUsersSteamDataFromDB.length > 0){
                log('Проверка стим профилей', moduleName)
                var AllSteamUsersIDList = GET_VALUES_FROM_OBJECT_BY_KEY(AllUsersSteamDataFromDB, 'steamid');
                var AllUsersSteamData = await getSteamUserData({ids: AllSteamUsersIDList});
                if (AllUsersSteamData.length == 0) {
                    return false
                }

                for (let steamDataOld of AllUsersSteamDataFromDB){
                    
                    let steamData = AllUsersSteamData.find(val => val.steamid === steamDataOld.steamid);

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

                    if (Number(steamDataOld.gameid) !== Number(steamData.gameid) && Number(steamData.gameid) !== 0){
                        steamChanges.text += `Играет в **${steamData.gameinfo!==''?steamData.gameinfo:'Неопределено' } (ID: ${steamData.gameid})**\n`;
                        steamChanges.isChanges = true;
                    }
    
                    if (Number(steamData.gameid) === 0 && Number(steamDataOld.gameid) !== 0){
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