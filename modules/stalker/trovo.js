var player = require('play-sound')(opts = {player:'mplayer'});

const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_GET_TRACKING_DATA_BY_ACTION, 
    manageGuildServiceTracking, getTrackingInfo, getGuildidsOfTrackingUserService } = require("../DB.js");
const { getTrovoUserStatus, getTrovoUserID, getTrovoClips } = require (`../../modules/stalker/requests.js`);
const { LogString, log } = require("../../tools/log.js");
const { getNumberWithSign } = require("../../modules/tools.js");

const { DownloadClip, VideoDirectoryCheck, StartRecording } = require (`../../modules/stalker/records.js`);

const { modules_stalker } = require('../../settings.js');

const { emoji_trovo } = require("../../constantes/emojis.js");
const StreamDefault = require (`../../modules/stalker/const_stream_default.js`);

const moduleName = `Stalker Trovo`;

module.exports = {
    MYSQL_TROVO_USER_TRACKING_CHANGE: async function(message, username, option){
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('trovodata', {username: username});
        if (userdata === null ) {
            let success = await MYSQL_TRACK_NEW_TROVO_USER(username);
            if (!success) {
                return {success: false, text: `Trovo user **${username}** not exists`}
            } else {
                userdata = success.dataValues;
            }
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'trovo', 'tracking', option.value, ['userid', userdata.userid], 'trovodata');
                break;
            case 'followers_tracking':
                await manageGuildServiceTracking(message.guild.id, 'trovo', 'followersTracking', option.value, ['userid', userdata.userid], 'trovodata');
                break;
            case 'clips_tracking':
                await manageGuildServiceTracking(message.guild.id, 'trovo', 'clipsTracking', option.value, ['userid', userdata.userid], 'trovodata');
                break;
            case 'records':
                if (message.author.id === '675367461901828126'){
                    await manageGuildServiceTracking(message.guild.id, 'trovo', 'records', option.value, ['userid', userdata.userid], 'trovodata');
                } else {
                    return {success: false, text: `У вас недостаточно прав для выполнения этого действия`}
                }
                break;    
            default:
                throw new Error('unexpected error: undefined action');
        }
        return {success: true, text: `Trovo user **${username}** set **${option.action}** is **${option.value}**`}
    },

    TROVO_TRACKING_INFO: async function(message){
        const fieldsMapping = [
            { name: 'Username', key: 'username' },
            { name: 'followers tracking', key: 'followersTracking' },
            { name: 'records', key: 'records' }
        ];
        await getTrackingInfo(message, 'streamersTrovo', 'trovo', emoji_trovo, moduleName, fieldsMapping);
    },

    checkTrovoFollowers: async function(stalkerEvents){
        try{
           
            //получаем всех юзеров у которых tracking = true и преобразовываем данные в обычный массив объектов
            let mysql_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('streamersTrovo');
            if (mysql_data.length > 0){
                log('Проверка статуса юзеров Трово', moduleName);
                //обработка результатов
                
                for (let userdata of mysql_data){
                    if (!await checkUserID(userdata)) continue;
                    if (userdata.followersTracking == true){
                        let userdataNew = await getTrovoUserStatus(userdata.username);
                        userdataNew.userid = userdata.userid;

                        let trovoChanges = {
                            username: userdata.username,
                            platform: 'Trovo',
                            diff: userdataNew.followers-userdata.followers,
                            count: userdataNew.followers,
                        };
                        
                        if (userdataNew.followers !== userdata.followers){
                            if (userdata.followers !== 0){
                                trovoChanges.guildids = await getGuildidsOfTrackingUserService('trovo_followersTracking', userdata.userid);
                                stalkerEvents.emit('StreamFolowers', trovoChanges);
                            }
                            await MYSQL_SAVE('trovodata', { username: userdata.username }, {followers: userdataNew.followers} );
                        }
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },

    checkTrovoStatus: async function (stalkerEvents){
        try{
           
            //получаем всех юзеров у которых tracking = true и преобразовываем данные в обычный массив объектов
            let mysql_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('streamersTrovo');
            if (mysql_data.length > 0){
                log('Проверка статуса юзеров Трово', moduleName);
                //обработка результатов
                
                for (let userdata of mysql_data){
                    if (!await checkUserID(userdata)) continue;

                    let userdataNew = await getTrovoUserStatus(userdata.username);
                    userdataNew.userid = userdata.userid;
                    
                    var trackingsGuildsOfChangesTrovoProfile = await getGuildidsOfTrackingUserService('trovo_tracking', userdata.userid);
                    
                    //проверка тайтла категории и фоловеров, исключая первое обновление
                    if (userdataNew.status === 'online' && userdata.status === 'online'){
                        let trovoChanges = {
                            text: '',
                            followersText: '',
                            username: userdata.username,
                            platform: 'Trovo',
                            isChanges: false,
                            guildids: trackingsGuildsOfChangesTrovoProfile,
                        };
    
                        
                        if (userdataNew.title !== userdata.title){
                            trovoChanges.text += `Название: **${userdataNew.title}**\n`;
                            trovoChanges.isChanges = true;
                        }
                        
                        if (userdataNew.cat !== userdata.cat){
                            trovoChanges.text += `Категория: **${userdataNew.cat}**\n`;
                            trovoChanges.isChanges = true;
                        }
                            
                        if(trovoChanges.isChanges == true){
                            stalkerEvents.emit('StreamChanges', trovoChanges);
                        }
                    };
    
                    if (userdataNew.status !== userdata.status){
                        let statusChanges = {
                            text: ``,
                            username: userdataNew.username,
                            platform: 'Trovo',
                            guildids: trackingsGuildsOfChangesTrovoProfile,
                        };
                        if (userdataNew.status === 'online'){
                            statusChanges.text = `**[${userdataNew.username}](https://trovo.live/s/${userdataNew.username})** начал трансляцию на Трово!\n`;
                            statusChanges.text += `Фоловеров: **${userdataNew.followers}**\n`;
                            statusChanges.text += `Категория: **${userdataNew.cat}**\n`;
                            statusChanges.text +=`Название: **${userdataNew.title}**\n`;
                            player.play('streamstart.mp3');
                        }
                        
                        if (userdataNew.status === 'offline'){
                            statusChanges.text = `**${userdataNew.username}** прекратил стримить.\n`;
                        }
    
                        stalkerEvents.emit('ChangeStreamStatus', statusChanges);
                    };
    
                    //сохраняем в базу только когда он онлайн
                    if (userdataNew.status === 'online' || userdata.status === 'online'){
                        delete userdataNew.followers;
                        await MYSQL_SAVE('trovodata', { username: userdata.username }, userdataNew );
                    }

                    //записи
                    if (modules_stalker.records == true && userdata.records === true ) {
                    
                        //проверка записей
                        try{
                            await VideoDirectoryCheck(userdataNew, 'trovo', stalkerEvents);
                        }catch(e){
                            console.log(e)
                        }
                        
                        if (userdataNew.status === 'online'){
                            try{
                                await StartRecording(userdataNew, 'trovo', stalkerEvents);
                            }catch(e){
                                console.log(e)
                            }
                        }
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },

    checkTrovoLastClips: async function(stalkerEvents){
        try{
            
            //получаем всех юзеров у которых tracking = true и преобразовываем данные в обычный массив объектов
            let mysql_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('streamersTrovo');
            if (mysql_data.length > 0){
                log('Проверка клипов Трово', moduleName);
                //обработка результатов
                
                for (let userdata of mysql_data){
                    if (!await checkUserID(userdata)) continue;

                    var clips = await getTrovoClips({channelid: userdata.userid});
                    if (clips.length>0){
                        var mysql_clipsdata = await MYSQL_GET_TRACKING_DATA_BY_ACTION('trovoclips', {userid: userdata.userid} );
                        
                        for (let clip of clips){
                            
                            let savedclip = mysql_clipsdata.find((val)=>{
                                return val.clipid === clip.clip_id;
                            });

                            if (typeof savedclip === 'undefined'){
                                //новый клип
                                //await DownloadClip(clip, 'trovo');
                                clip.title = clip.title.replace(/[^А-яЁёA-z0-9 ]/g,'');
                                clip.guildids = await getGuildidsOfTrackingUserService('trovo_clipsTracking', userdata.userid);
                                stalkerEvents.emit( 'newClipTrovo', clip );
                                await MYSQL_SAVE('trovoclips',{clipid: clip.clip_id},{userid: userdata.userid})
                            }
                        }
                    }
                    
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
        
    }
}

async function checkUserID(userdata){
    if (userdata.userid == 0){
        try{
            userdata.userid = await getTrovoUserID(userdata.username);
            await MYSQL_SAVE('trovodata', { username: userdata.username }, {userid: userdata.userid} );
            return true
        } catch (e){
            LogString(`System`, `Error`, moduleName, `UNKNOWN USER: ${userdata.username}. CHECK DB!`);
            return false
        }
    }
    return true;
}

async function MYSQL_TRACK_NEW_TROVO_USER(username){
    let newEntry = Object.assign({}, StreamDefault);
    newEntry.username = username;
    newEntry.followersTracking = false;
    newEntry.userid = 0
    try{
        newEntry.userid = await getTrovoUserID(username);
    } catch (e){
        return false
    }
    return await MYSQL_SAVE('trovodata', { username: newEntry.username }, newEntry);
}