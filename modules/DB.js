
const { log } = require("../tools/log.js");
const { SendAnswer } = require("../tools/embed.js");

const { getGuildChannelDB } = require("../modules/GuildChannel.js")

const { table_id_names } = require("../constantes/table_id_names.js");

const moduleName = 'Datebase';

const { modules, modules_stalker } = require('../settings.js');
const { emoji_twitch } = require("../constantes/emojis.js");
const { getTwitchSteamsByCategory } = require("./stalker/requests.js");

const { onlyUnique } = require("./tools.js");
const { MYSQL_SAVE, MYSQL_DELETE, MYSQL_GET_ONE, MYSQL_GET_ALL } = require("mysql-tools");

function GET_VALUES_FROM_OBJECT_BY_KEY (arrayobject, valuekey){
    var res = [];
    for (let data of arrayobject){
        res.push(data[valuekey]);
    }
    return res;
}

async function getTrackingUsersForGuild(guildid, platformaction, mysql_tablename){
    let guildServicesTracking_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('guildServicesTracking', {
        guildid: guildid,
        platformaction: platformaction
    });

    if (guildServicesTracking_data.length>0){
        let guildServicesTracking_userdata = GET_VALUES_FROM_OBJECT_BY_KEY(guildServicesTracking_data, 'key');

        var searchUserID = table_id_names.filter( obj => obj.platforms.includes(platformaction.split("_")[0]));
        
        if (searchUserID.length === 0){
            throw Error('getTrackingUsersForGuild: undefined platfform ' + platformaction);
        } else {
            searchUserID = (searchUserID.shift()).name_id;
        }
        
        return await MYSQL_GET_TRACKING_DATA_BY_ACTION(mysql_tablename, { [searchUserID]: guildServicesTracking_userdata } );
    } else {
        return [];
    }
}

async function getTrackingInfo(message, mysql_tablename, trackingType, emoji, moduleName, fieldsMapping) {
    const mysql_data = await getTrackingUsersForGuild(
        message.guild.id, 
        `${trackingType}_tracking`, 
        mysql_tablename );
    

    if (mysql_data.length > 0) {
        let MessageFields = [];
        let fieldValuesById = {};

        for (let userdata of mysql_data) {
            for (let field of fieldsMapping) {
                let key = field.key;
                let value = userdata[key].toString();

                if (!fieldValuesById[key]) {
                    fieldValuesById[key] = [];
                }

                fieldValuesById[key].push(value);
            }
        }

        for (let field of fieldsMapping) {
            let key = field.key;
            let values = fieldValuesById[key].join('\n');
            MessageFields.push({ name: field.name, value: values, inline: true });
        }

        await SendAnswer({
            channel: message.channel,
            guildname: message.guild.name,
            messagetype: 'info',
            title: `${emoji} ${moduleName}`,
            text: 'Tracking users info',
            fields: MessageFields,
        });

    } else {

        await SendAnswer({
            channel: message.channel,
            guildname: message.guild.name,
            messagetype: 'info',
            title: `${emoji} ${moduleName}`,
            text: 'No tracking users',
        });

    }
}

async function MYSQL_GET_TRACKING_DATA_BY_ACTION( action, custom_query_params = {} ){
    var query_params = {};
    var query_action = action;

    switch (action){
        case 'steamuser':
        case 'streamersTrovo':
        case 'streamersTwitch':
        case 'twitchchat':
        case 'osuprofile':
        case 'vkuser':
        case 'youtubechannel':
            query_params = {tracking: true};
            break;
        case 'vkuser_friends':
            query_action = 'vkuser';
            query_params = {tracking: true, friendsTracking: true};
            break;
        case 'guildSettings':
        case 'trovoclips':
        case 'twitchclips':
        case 'guildServicesTracking':
        case 'vkfriend':
        case 'botchannel':
            query_params = custom_query_params;
            break;
        default:
            throw new Error('undefined action');
    }

	switch (action) {
		case `twitchclips`:
		case `trovoclips`:
		case `vkfriend`:
			if (typeof query_params.userid === 'undefined') 
				throw new Error('unknown userid');
		break;
	}

    return await MYSQL_GET_ALL({ action: query_action, params: query_params });
}

async function manageGuildServiceTracking (guildid, platform, action, value, trackingdata, mysql_tablename){

    const keyname = trackingdata[0];
    const keyvalue = trackingdata[1].toString();

    if (value === true){

        await MYSQL_SAVE('guildServicesTracking', {
            guildid: guildid,
            platformaction: `${platform}_${action}`,
			key: keyvalue 
		});

        await MYSQL_SAVE( mysql_tablename, { [keyname]: keyvalue , [action]: value });

        log('Добавлен новый канал в тренкинг лист ' + keyvalue, moduleName);

    } else {

        await MYSQL_DELETE('guildServicesTracking', {
            guildid: guildid,
            platformaction: `${platform}_${action}`,
            key: keyvalue
        });

        log( 'Удален канал из тренкинг листа гильдии ' + keyvalue, moduleName );

        //поиск по всем гильдиям
        const foundedchannel = await MYSQL_GET_ONE('guildServicesTracking', {
            platformaction: `${platform}_${action}`, 
            key: keyvalue
        });

        if (foundedchannel === null){
            await MYSQL_SAVE(mysql_tablename, { [keyname]: keyvalue , [action]: value });
            log( 'Будет отключен общий трекинг. Канал не отслеживается не одной гильдией ' + keyvalue, moduleName );
        };
    }
}

module.exports = {



    MYSQL_TWITCH_CHAT_TRACKING_CHANGE: async (message, username, option) => {
        //проверка юзера и создаание нового юзера
        let userdata = await MYSQL_GET_ONE('twitchchat', {username: username});
        
        if (userdata === null ) {
            userdata = {
                username: username,
                tracking: true
            }
        }
    
        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(
                    message.guild.id, 
                    'twitchchat', 
                    'tracking', 
                    option.value, 
                    ['username', userdata.username], 
                    'twitchchat' );
                break;
            default:
                throw new Error('unexpected error: undefined action');
        }
    
        if (modules.stalker){  
            if (modules_stalker.twitchchat){  
                //need restart
            }
        }
    
        return {success: true, text: `Twitch chat for user **${username}** set **${option.action}** is **${option.value}**`}
    },

    
    TWITCHCHAT_TRACKING_INFO: async function  (message){

        var mysql_data = await getTrackingUsersForGuild(
            message.guild.id, 
            'twitchchat_tracking', 
            'twitchchat'
        );

        if (mysql_data.length > 0){

            let MessageFields = [];
            var usernamesFields = '';
            var channelids = '';
            var channelurls = '';

            for (let userdata of mysql_data){
                let username = userdata.username.toString();
                let channelname = `twitchchat_${username}`;
                let chatchannel = await getGuildChannelDB(message.guild, channelname);
                usernamesFields += `${username}\n`;
                channelids += `<#${chatchannel.id}>\n`;
                channelurls += `[ссылка](https://www.twitch.tv/popout/${username}/chat)\n`;
            }

            MessageFields.push ({name: 'Username', value: usernamesFields, inline: true});
            MessageFields.push ({name: 'Channel', value: channelids, inline: true});
            MessageFields.push ({name: 'Link', value: channelurls, inline: true});

            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_twitch} ${moduleName}`,
                text: `Tracking users info`,
                fields: MessageFields} );

        } else {

            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_twitch} ${moduleName}`,
                text: `No tracking users`});

        }
    },
    
    getTrackingInfo: getTrackingInfo,
    getTrackingUsersForGuild: getTrackingUsersForGuild,
    MYSQL_GET_TRACKING_DATA_BY_ACTION: MYSQL_GET_TRACKING_DATA_BY_ACTION,
    manageGuildServiceTracking: manageGuildServiceTracking,


    getGuildidsOfTrackingUserServiceByGuildId: async function (platformaction, guildid = 0){
        const query = guildid === 0? 
            { platformaction: platformaction }: 
            { platformaction: platformaction, guildid: guildid.toString() };
        const mysql_data = await MYSQL_GET_ALL({ action: 'guildServicesTracking', params: query });
        return GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'key');
    },

    getGuildidsOfTrackingUserService: async function (platformaction, key){
        const mysql_data = await MYSQL_GET_ALL({ action: 'guildServicesTracking', params: {
            platformaction: platformaction,
            key: key.toString()
        }});
        const guildids = GET_VALUES_FROM_OBJECT_BY_KEY( mysql_data, 'guildid' );
        return guildids.filter( (value, index, self) => self.indexOf(value) === index );
    },

    manageGuildCryptoTracking: async function (guildid, platform, action, pair, is_tracking ){
        const key = `${pair.first}-${pair.second}`;

        if (is_tracking === true){

            await MYSQL_SAVE( 'guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                key: key
            });

            log('Добавлен новая криптопара в тренкинг лист '+key, moduleName);

        } else {

            await MYSQL_DELETE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                key: key
            });

            log('Удалена криптопара из тренкинг листа '+key, moduleName);
        }
    }

}