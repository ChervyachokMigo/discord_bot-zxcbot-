const { MYSQL_SAVE, MYSQL_GET_ALL, MYSQL_GET_ONE, MYSQL_GET_ALL_RESULTS_TO_ARRAY, 
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService } = require("../DB.js");
const { LogString, log } = require("../../tools/log.js");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../modules/tools.js");
const { SendAnswer } = require("../../tools/embed.js");

const { getTwitchFolowers, getTwitchUserStatus, getLastTwitchClips, getTwitchUserID } = require (`../../modules/stalker/requests.js`);
const { DownloadClip, VideoDirectoryCheck, StartRecording } = require (`../../modules/stalker/records.js`);
const { getChatters, ClearChatters } = require (`../../modules/stalker/twitchchat.js`);

const { stalkerClipsCheckLastDays } = require('../../settings.js');
const { modules_stalker } = require('../../settings.js');

const StreamDefault = require (`../../modules/stalker/const_stream_default.js`);
const { emoji_twitch } = require("../../constantes/emojis.js");

const moduleName = `Stalker Twitch`;

module.exports = {

    MYSQL_TWITCH_USER_TRACKING_CHANGE: async function(message, username, option){
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('twitchdata', {username: username});
        if (userdata === null ) {
            let success = await MYSQL_TRACK_NEW_TWITCH_USER(username);
            if (!success) {
                return {success: false, text: `Twitch user **${username}** not exists`}
            } else {
                userdata = success.dataValues;
            }
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'twitch', 'tracking', option.value, ['userid', userdata.userid], 'twitchdata');
                break;
            case 'followers_tracking':
                await manageGuildServiceTracking(message.guild.id, 'twitch', 'followersTracking', option.value, ['userid', userdata.userid], 'twitchdata');
                break;
            case 'clips_tracking':
                await manageGuildServiceTracking(message.guild.id, 'twitch', 'clipsTracking', option.value, ['userid', userdata.userid], 'twitchdata');
                break;
            case 'records':
                if (message.author.id === '675367461901828126'){
                    await manageGuildServiceTracking(message.guild.id, 'twitch', 'records', option.value, ['userid', userdata.userid], 'twitchdata');
                } else {
                    return {success: false, text: `У вас недостаточно прав для выполнения этого действия`}
                }
                break;
            case 'clips_records':
                if (message.author.id === '675367461901828126'){
                    await manageGuildServiceTracking(message.guild.id, 'twitch', 'clipsRecords', option.value, ['userid', userdata.userid], 'twitchdata');
                } else {
                    return {success: false, text: `У вас недостаточно прав для выполнения этого действия`}
                }
                break;
            default:
                throw new Error('unexpected error: undefined action');
        }
        return {success: true, text: `Twitch user **${username}** set **${option.action}** is **${option.value}**`}

    },

    TWITCH_TRACKING_INFO: async function(message){
        var mysql_data = await getTrackingUsersForGuild(message.guild.id, 'twitch_tracking', 'streamersTwitch');
        if (mysql_data.length > 0){
            let MessageFields = [];
            var usernamesFields = '';
            var followersFields = '';
            var clipsFields = ''; 
            var recordsFields = '';
            var clipsRecordsFields = '';
            for (let userdata of mysql_data){
                userdata.followersTracking = userdata.followersTracking==true?`**${userdata.followersTracking}**`:userdata.followersTracking;
                userdata.clipsTracking = userdata.clipsTracking==true?`**${userdata.clipsTracking}**`:userdata.clipsTracking;
                userdata.records = userdata.records==true?`**${userdata.records}**`:userdata.records;
                userdata.clipsRecordsFields = userdata.clipsRecordsFields==true?`**${userdata.clipsRecordsFields}**`:userdata.clipsRecordsFields;
                usernamesFields += `${userdata.username.toString()}\n`;
                followersFields += `${userdata.followersTracking.toString()}\n`;
                clipsFields += `${userdata.clipsTracking.toString()}\n`;
                recordsFields += `${userdata.records.toString()}\n`;
                clipsRecordsFields += `${userdata.records.toString()}\n`;
            }
            MessageFields.push ({name: 'Username', value: usernamesFields, inline: true});
            MessageFields.push ({name: 'followers tracking', value: followersFields, inline: true});
            MessageFields.push ({name: 'clips tracking', value: clipsFields, inline: true});
            MessageFields.push ({name: 'records', value: recordsFields, inline: true});
            MessageFields.push ({name: 'clips records', value: clipsRecordsFields, inline: true});
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
                text: `No tracking users`}  );
        }
    },

    checkTwitchStatus: async function (stalkerEvents){
        try{
            log('Проверка статуса юзеров Твича', moduleName);
            //получаем всех юзеров у которых tracking = true и преобразовываем данные в обычный массив объектов
            let mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('streamersTwitch'));
            if (mysql_data.length > 0){
                //получение статуса всех пользователей сразу
                let usernames = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'username');
                let onlineUsersData = await getTwitchUserStatus(usernames);
                //обработка результатов
                for (let userdata of mysql_data){
                    //если отсутствует id - получение id и сохранение
                    if (userdata.userid == 0) {
                        userdata.userid = await getTwitchUzserID(userdata.username);
                        await MYSQL_SAVE('twitchdata', { username: userdata.username }, {userid: userdata.userid});
                    }

                    //поиск пользователя из базы в новом запросе
                    let userdataNew = onlineUsersData.filter((val) => {
                        return val.user_login === userdata.username
                    });
                    //если нет данных, значит юзер - оффлайн
                    if (userdataNew.length == 0){
                        userdataNew = {
                            status: 'offline',
                            username: userdata.username,
                            cat: userdata.cat, 
                            title: userdata.title,
                        };
                    } else {
                        userdataNew = userdataNew[0];
                        userdataNew = {
                            status: 'online',
                            username: userdataNew.user_login, 
                            cat: userdataNew.game_name, 
                            title: userdataNew.title,
                        };
                    }
                    if( (userdataNew.status === 'online' && userdata.status === 'online') ||
                         (userdataNew.status !== userdata.status)){
                    var trackingsGuildsOfChangesTwitchProfile = await getGuildidsOfTrackingUserService('twitch_tracking', userdata.userid);
                    }
                    //если статус изменился - отправляем сообщение
                    if (userdataNew.status !== userdata.status){
                        let changesdata = {
                            text: ``,
                            username: userdataNew.username,
                            platform: 'Twitch',
                            guildids: trackingsGuildsOfChangesTwitchProfile,
                        };
                        if (userdataNew.status === 'online'){
                            changesdata.text = `**[${userdataNew.username}](https://www.twitch.tv/${userdataNew.username})** стримит прямо сейчас!\n`;
                            changesdata.text += `Категория: **${userdataNew.cat}**\n`;
                            changesdata.text += `Название: **${userdataNew.title}**\n`;                  
                        }
                        if (userdataNew.status === 'offline'){
                            changesdata.text = `**${userdataNew.username}** прекратил стримить.\n`;
                            if (modules_stalker.twitchchat){
                                let trackingsGuildsTwitchChat = await getGuildidsOfTrackingUserService('twitchchat_tracking',userdataNew.username);
                        
                                stalkerEvents.emit('TwitchChattersOfEndStream', 
                                    {guildids: trackingsGuildsTwitchChat, 
                                    chatters: getChatters(userdataNew.username)});
                                ClearChatters(userdataNew.username);
                            }
                        }
                        stalkerEvents.emit('ChangeStreamStatus', changesdata);
                    }

                    //если пользователь онлайн - проверяем изменившиеся данные, исключая первое обновление
                    if(userdataNew.status === 'online' && userdata.status === 'online'){
                        let twitchChanges = {
                            text: '',
                            username: userdataNew.username,
                            platform: 'Twitch',
                            isChanges: false,
                            guildids: trackingsGuildsOfChangesTwitchProfile,
                        };

                        if (userdataNew.title !== userdata.title){
                            twitchChanges.text += `Название: **${userdataNew.title}**\n`;
                            twitchChanges.isChanges = true;
                        }

                        if (userdataNew.cat !== userdata.cat){
                            twitchChanges.text = `Категория: **${userdataNew.cat}**\n`;
                            twitchChanges.isChanges = true;
                        }
                        
                        if(twitchChanges.isChanges == true){
                            stalkerEvents.emit('StreamChanges', twitchChanges);
                        }
                    }
                    
                    //сохраняем в базу только когда он онлайн
                    if (userdataNew.status === 'online' || userdata.status === 'online'){
                        await MYSQL_SAVE('twitchdata', { username: userdata.username }, userdataNew);
                    }

                    

                    //записи
                    if (modules_stalker.records == true && userdata.records === true ) {
                        
                        //проверка записей
                        try{
                            await VideoDirectoryCheck(userdataNew, 'twitch', stalkerEvents);
                        }catch(e){
                            console.log(e)
                        }
                        
                        if (userdataNew.status === 'online'){
                            try{
                                await StartRecording(userdataNew, 'twitch', stalkerEvents);
                            }catch(e){
                                console.log(e)
                            }
                        }
                    }
                    
                }
            }
        } catch (e){
            
                LogString(`System`, `Error`, moduleName, e.code);
            
        }
    },

    checkUserTwitchFolowers: async function (stalkerEvents){
        try{
            log('Проверка фоловеров юзеров Твича')
            //получаем всех пользователей у которых tracking = true и преобразовываем в обычный массив объектов
            let mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('streamersTwitch'));
            if (mysql_data.length > 0){
                for (let userdata of mysql_data){
                    if (userdata.followersTracking == true){
                        //получаем количество фоловеров от твича
                        let twitch_followers = await getTwitchFolowers(userdata.userid);
        
                        if (twitch_followers == -1) {
                            log('get followers error', moduleName);
                            return;
                        }
        
                        //сохраняем, если количество не совпадает с сохраненным
                        if (twitch_followers !== userdata.followers){
        
                            var params = {
                                username: userdata.username,
                                count: twitch_followers,
                                diff: (twitch_followers-userdata.followers),
                                platform: 'Twitch',
                            }
        
                            //сообщаем если количество изменилось и не было первым обновлением в базе
                            if (userdata.followers !== twitch_followers && userdata.followers !== 0){
                                params.guildids = await getGuildidsOfTrackingUserService('twitch_followersTracking', userdata.userid);
                                stalkerEvents.emit('StreamFolowers', params);
                            }
        
                            //если значение изменилось - записать в базу
                            if (userdata.followers !== twitch_followers){
                                await MYSQL_SAVE('twitchdata', { username: userdata.username }, {followers: twitch_followers} );
                            }
                        }
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },

    checkUserTwitchClips: async function (stalkerEvents, days = stalkerClipsCheckLastDays){
        try{
            log('Проверка клипов юзеров Твича', moduleName)
            //получаем всех пользователей у которых tracking = true и преобразовываем в обычный массив объектов
            let users_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('streamersTwitch'));
            
            if ( users_data.length > 0 ){
                
                for ( let userdata of users_data ){
                    if (userdata.clipsTracking == true){
                        
                        if ( userdata.userid == 0 ){
                            log('ошибка пользователя, не получен id', moduleName)
                            continue
                        }

                        //получение данных клипов за последние days
                        let newclips_data = await getLastTwitchClips(userdata.userid, days);
                        if ( newclips_data == -1 ) {
                            log('невозможно получить данные', moduleName);
                            continue
                        }
                        if(newclips_data && newclips_data.length>0){
                            log(`Обнаружено ${newclips_data.length} клипов за ${days} дней на канале ${userdata.username}`, moduleName);
                        } else {
                            log(`На канале ${userdata.username} не найдены  клипы`, moduleName)
                            continue
                        }
                        //получаем все клипы пользователя и преобразовываем в обычный массив объектов
                        let clips_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('twitchclips', { userid: Number(userdata.userid) } ));
                        
                        if ( clips_data && clips_data.length > 0 ){
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

                        //если найдены новые клипы
                        //сохраняем их в базу и отправляем сообщение
                        if ( newclips  && newclips.length > 0 ){
                            LogString(`System`, `info`, moduleName, `Новых клипов на канале ${userdata.username} - ${newclips.length}`);
                            let N = 1;
                            let clipsGuildids = await getGuildidsOfTrackingUserService('twitch_clipsTracking', userdata.userid);
                            for ( let clipdata of newclips ){    
                                clipdata.title = clipdata.title.replace(/[^А-яЁёA-z0-9 ]/g,'');
                                clipdata.guildids = clipsGuildids;

                                if (userdata.clipsRecords == true){
                                    log(`Загрузка клипа (${N}/${newclips.length}): ${clipdata.id} - ${clipdata.title} от ${clipdata.creator_name}...`, moduleName);
                                    var code = await DownloadClip(clipdata, 'twitch');
                                    //console.log(`клип загружен с кодом ${code}`)
                                }
                                
                                stalkerEvents.emit( 'newClipTwitch', clipdata );
                                await MYSQL_SAVE( 'twitchclips', {clipid: clipdata.id}, {userid: Number(userdata.userid) } );
                                N++;
                            }
                        } else{
                            log(`Новых клипов на канале ${userdata.username} не найдено`, moduleName)
                        }
                        
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    }
}

async function MYSQL_TRACK_NEW_TWITCH_USER (username){
    var newEntry = Object.assign({}, StreamDefault);
    newEntry.username = username;
    newEntry.followersTracking = false;
    newEntry.clipsTracking = false;
    try{
        newEntry.userid = await getTwitchUserID(username);
    } catch (e){
        return false
    }
    return await MYSQL_SAVE('twitchdata', { username: newEntry.username }, newEntry);
}