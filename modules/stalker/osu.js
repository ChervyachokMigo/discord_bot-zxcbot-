const { v2 } = require ('osu-api-extended');

const { MYSQL_SAVE, MYSQL_GET_ALL, MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ONE, 
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService } = require("../DB.js");
const { getTimeMSKToStringFormat, timeAgo, getDiscordRelativeTime } = require('../../tools/time.js');
const { getNumberWithSign, getFixedFloat,  GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../modules/tools.js");
const { LogString, log } = require("../../tools/log.js");
const { SendAnswer, SendError } = require("../../tools/embed.js")

const { checkTokenExpires } = require (`../../modules/stalker/requests.js`);

const { stalkerOsuScoresRefreshRate, 
    stalkerBestScoresLimit, 
    stalkerMinScorePP, 
    stalkerActivitiesLimit, 
    stalkerScoresMinimumPlace} = require('../../settings.js');
const { emoji_osu } = require("../../constantes/emojis.js");

const moduleName = `Stalker Osu`;

function changesIsNan(param){ if(isNaN(param)) {return 0;} else {return param;} }

async function getOsuUserData(userid, mode = 'osu'){
    if (!await checkTokenExpires('osu')){
        log('cant get osu token');
        return false;
    };
    var data = await v2.user.details(userid, mode);
    if (data.error === null){
        return data;
    }
    if (data.error || typeof data.statistics === 'undefined' || typeof data.statistics.pp === 'undefined'){
        console.log(data);
        return {error: null}
    }
    var res = {};

    res.userid = Number(data.id);
    res.username = data.username;
    res.pp = parseInt(getFixedFloat(data.statistics.pp, 2)*100);
    res.rank = parseInt(data.statistics.global_rank);
    res.acc = parseInt(getFixedFloat(data.statistics.hit_accuracy,2)*100);
    res.countryrank = parseInt(data.statistics.country_rank);
    res.lastactive = parseInt(new Date(data.last_visit).valueOf()/1000);
    res.online = data.is_online;
    res.followers = parseInt(data.follower_count);
    res.mainmode = data.playmode;
    res.avatar = data.avatar_url;
    return res;
}


function getOsuProfileChanges(userinfo_new, userinfo_old){

    var user_summary_changes = {
        userid: userinfo_new.userid,
        ischanges: 'no',
        text: `**[${userinfo_new.username}](https://osu.ppy.sh/users/${userinfo_new.userid})** в **${userinfo_old.mainmode}** имеет изменения:\n`,
    };

    if (userinfo_new.username !== userinfo_old.username){
        user_summary_changes.text += `**${userinfo_old.username}** изменил ник на **${userinfo_new.username}**!\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_new.mainmode !== userinfo_old.mainmode){
        user_summary_changes.text += `Основной мод на **${userinfo_new.mainmode}**\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_new.avatar !== userinfo_old.avatar){
        user_summary_changes.text += `Новый аватар\n`;
        user_summary_changes.avatar = userinfo_new.avatar;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_new.pp !== userinfo_old.pp && typeof userinfo_new.pp !== 'undefined' && isNaN(userinfo_new.pp) == false){
        let pptotal = getFixedFloat(userinfo_new.pp*0.01,2);
        let ppchanged = getNumberWithSign(changesIsNan(getFixedFloat( (userinfo_new.pp-userinfo_old.pp)*0.01, 2)));
        let ppchangedpercentoftotal = getNumberWithSign(getFixedFloat(ppchanged/pptotal, 2));
        let ppchangedtext = '';
        if (ppchanged !== '' && typeof ppchanged !== 'undefined'){
            ppchanged = `${ppchanged} pp`;
            if (ppchangedpercentoftotal !== '' && typeof ppchangedpercentoftotal !== 'undefined'){
                ppchangedpercentoftotal = `${ppchangedpercentoftotal} %`;
                ppchangedtext = `(${ppchanged}, ${ppchangedpercentoftotal})`;
            } else {
                ppchangedtext = `(${ppchanged})`;
            }
        }
        user_summary_changes.text += `Пеппи поинтс: **${pptotal}pp ${ppchangedtext}**\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_new.acc !== userinfo_old.acc){
        user_summary_changes.text += `Акка: **${getFixedFloat(userinfo_new.acc*0.01,2)} ${getNumberWithSign(changesIsNan(getFixedFloat( (userinfo_new.acc-userinfo_old.acc)*0.01, 2)))}** %\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_new.rank !== userinfo_old.rank && typeof userinfo_new.rank !== 'undefined' && isNaN(userinfo_new.rank) == false){
        user_summary_changes.text += `Глобал ранк: **#${userinfo_new.rank} ${getNumberWithSign(changesIsNan(userinfo_new.rank-userinfo_old.rank))}**\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_new.countryrank !== userinfo_old.countryrank && typeof userinfo_new.countryrank !== 'undefined'  && isNaN(userinfo_new.countryrank) == false){
        user_summary_changes.text += `Ранк по стране: **#${userinfo_new.countryrank} ${getNumberWithSign(changesIsNan(userinfo_new.countryrank-userinfo_old.countryrank))}**\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if (userinfo_old.online == true && userinfo_new.online == false){
        user_summary_changes.text += `Сейчас **оффлайн**!\n`;
        user_summary_changes.text += `Последний раз заходил в: **${getTimeMSKToStringFormat(new Date(userinfo_new.lastactive*1000))} (по МСК)**\n`;
        user_summary_changes.text += `${getDiscordRelativeTime(userinfo_new.lastactive*1000)}\n`;
        user_summary_changes.ischanges = 'yes';
    }

    if(userinfo_new.online == true && userinfo_old.online == false){
        let sleeptime = userinfo_new.lastactive - userinfo_old.lastactive;
        if( sleeptime > (stalkerOsuScoresRefreshRate + 10) ){
            user_summary_changes.text += `Сейчас **онлайн**!\n`;
            user_summary_changes.text += `Был оффлайн: **${timeAgo(sleeptime)}**\n`;
            user_summary_changes.text += `в: **${getTimeMSKToStringFormat(new Date(userinfo_new.lastactive*1000))} (по МСК)**\n`;
            user_summary_changes.text += `${getDiscordRelativeTime(userinfo_new.lastactive*1000)}\n`;
            user_summary_changes.ischanges = 'yes';
        }
    }

    return user_summary_changes;
        
}

module.exports = {
    
    getOsuUserInfoByCommand: async function (comargs, message, com_text){
    
        if (!comargs[0]){
            await SendError(message, com_text, `Введите ID или Никнейм профиля`);
            return
        }
    
        var user = typeof comargs[0] === 'number'?comargs[0]:comargs.join(" ").replace(`"`,''); 
        
        if (!await checkTokenExpires('osu')){
            log('cant get osu token');
            return false;
        };

        var user_summary = await v2.user.details(user, "osu" );
        if (typeof user_summary.error !== 'undefined'){
            await SendError(message, com_text, `Ошибка, проверьте команду`);
            return
        }

        if (user_summary.playmode !== 'osu'){
            user_summary = await v2.user.details(user, user_summary.playmode );
            if (typeof user_summary.error !== 'undefined'){
                await SendError(message, com_text, `Ошибка, проверьте команду`);
                return
            }
        }
        
        user_summary = getUserSummary(user_summary);
    
        var text = getTextByOsuUserSummary(user_summary);
        
        await SendAnswer(  {channel: message.channel,
            guildname: message.guild.name,
            messagetype: `info`,
            title: `${emoji_osu} ${com_text.name}`,
            text:  text } );
    
    },

    OSU_TRACKING_INFO: async function (message){
        var mysql_data = await getTrackingUsersForGuild(message.guild.id, 'osuprofile_tracking', 'osuprofile');
        console.log('OSU_TRACKING_INFO','guild',message.guild.id,'data', mysql_data)
        if (mysql_data.length > 0){
            let MessageFields = [];
            var usernamesFields = '';
            var useridsFields = '';
            for (let userdata of mysql_data){
                useridsFields += `${userdata.userid.toString()}\n`;
                usernamesFields += `${userdata.username.toString()}\n`;
            }
            MessageFields.push ({name: 'User ID', value: useridsFields, inline: true});
            MessageFields.push ({name: 'Username', value: usernamesFields, inline: true});
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_osu} ${moduleName}`,
                text: `Tracking users info`,
                fields: MessageFields} );
        } else {
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_osu} ${moduleName}`,
                text: `No tracking users`});
        }
    },

    MYSQL_OSU_USER_TRACKING_CHANGE: async function(message, userid, option){
        var userid = isNaN( Number(userid))?{username:userid.toString()}:{userid:Number(userid)};
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('osuprofile', userid);
        if (userdata === null ) {
            var osuserdata = await getOsuUserData(userid,'osu');
            if (typeof osuserdata.userid === 'undefined' || osuserdata.error){
                return {success: false, text: `Osu user **${userid}** not exists`}
            }
            osuserdata.tracking = Boolean(option.value);
            await MYSQL_SAVE('osuprofile', { userid: osuserdata.userid }, osuserdata);
            userdata = osuserdata;
            
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'osuprofile', 'tracking', option.value, ['userid', Number(userdata.userid)], 'osuprofile');
                await module.exports.checkOsuData(undefined, true, userdata.userid);
                break;
            default:
                throw new Error(`unexpected error: undefined action: ${option.action}`);
        }
        return {success: true, text: `Osu user **${userdata.username}** set **${option.action}** is **${option.value}**`}

    },

    checkOsuFollowers: async function(stalkerEvents){
        
        
        if (!await checkTokenExpires('osu')){
            log('cant get osu token');
            return false;
        };
        var AllUsersOsuDataFromDB = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('osuprofile', {tracking: true}));
        if (AllUsersOsuDataFromDB.length > 0){
            log('Проверка осу фолловеров', moduleName)
            for (let osuUserDataOld of AllUsersOsuDataFromDB){

                var osuUserDataNew = await getOsuUserData(osuUserDataOld.userid, osuUserDataOld.mainmode);

                if (typeof osuUserDataNew.userid === 'undefined' || osuUserDataNew.error){
                    await module.exports.MYSQL_OSU_USER_TRACKING_CHANGE(osuUserDataOld.userid, {action: 'tracking', value: false});
                    continue
                }

                if (parseInt(osuUserDataNew.followers) !== parseInt(osuUserDataOld.followers)){
                    var trackingsGuildsOsuProfile = await getGuildidsOfTrackingUserService('osuprofile_followersTracking',osuUserDataNew.userid);
                    var text = `**[${osuUserDataNew.username}](https://osu.ppy.sh/users/${osuUserDataNew.userid})** имеет изменения:\n`;
                    text += `Изменения фоловеров: **${osuUserDataNew.followers} ${getNumberWithSign(changesIsNan(osuUserDataNew.followers - osuUserDataOld.followers))}**\n`;
                    await MYSQL_SAVE('osuprofile', { userid: osuUserDataNew.userid }, {followers: osuUserDataNew.followers} );
                    stalkerEvents.emit('osuFollowersChanges', {guildids: trackingsGuildsOsuProfile, userid: osuUserDataNew.userid, text: text});
                }
            }
        }
    },

    checkOsuData: async function(stalkerEvents, isSilent = false, forUserid = 0){
        try{
            
            
            if (!await checkTokenExpires('osu')){
                log('cant get osu token');
                return false;
            };
            var AllUsersOsuDataFromDB = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('osuprofile', {tracking: true}));
            if (AllUsersOsuDataFromDB.length > 0){
                if (stalkerEvents === undefined){
                    isSilent = true;
                    log('Проверка осу профилей (бесшумная)', moduleName)
                } else {
                    log('Проверка осу профилей', moduleName)
                }
                for (let osuUserDataOld of AllUsersOsuDataFromDB){
                    if (forUserid > 0 && osuUserDataOld.userid !== forUserid){
                        continue;
                    }

                    var osuUserDataNew = await getOsuUserData(osuUserDataOld.userid, osuUserDataOld.mainmode);

                    if (typeof osuUserDataNew.userid === 'undefined' || osuUserDataNew.error){
                        await module.exports.MYSQL_OSU_USER_TRACKING_CHANGE(osuUserDataOld.userid, {action: 'tracking', value: false});
                        continue
                    }

                    delete osuUserDataOld.followers;
                    delete osuUserDataNew.followers;

                    var trackingsGuildsOsuProfile = await getGuildidsOfTrackingUserService('osuprofile_tracking',osuUserDataNew.userid);
                    
                    var ProfileChanges = getOsuProfileChanges(osuUserDataNew, osuUserDataOld);
                    
                    if (ProfileChanges.ischanges === 'yes'){
                        await MYSQL_SAVE('osuprofile', { userid: osuUserDataNew.userid }, osuUserDataNew );
                        if (isSilent == false){
                            stalkerEvents.emit('osuProfileChanges', {guildids: trackingsGuildsOsuProfile, userid: ProfileChanges.userid, text: ProfileChanges.text, image: typeof ProfileChanges.avatar==='undefined'?'':ProfileChanges.avatar});
                        }
                    }

                    //недавние скоры
                    /*log('Проверка недавних скоров осу', moduleName)
                    let recentscores = await v2.user.scores.category(osuUserDataNew.userid,"recent", {limit: stalkerBestScoresLimit});

                    for (let score of recentscores){
                        if (score.pp !== null){
                            if (score.pp > stalkerMinScorePP){
                                let scoreobj = getScoreObject(score);
                            
                                let newscore = await addNewScore(scoreobj);
                                if(newscore !== false){
                                    if (isSilent == false){
                                        stalkerEvents.emit('newScore', {userid: scoreobj.userid, text: newscore.text});
                                    }
                                }
                            }
                        }
                    }*/

                    //бест скоры
                    log(`Проверка лучших скоров осу у ${osuUserDataNew.username}`, moduleName)
                    let topscores = await v2.user.scores.category(osuUserDataNew.userid, "best", {limit: stalkerBestScoresLimit});

                    for (let score of topscores){
                        if (score.pp !== null){
                            if (score.pp > stalkerMinScorePP){
                                let scoreobj = getScoreObject(score);
                                let newscore = await addNewScore(scoreobj);
                                if(newscore !== false){
                                    if (isSilent == false){
                                        stalkerEvents.emit('newScore', {guildids: trackingsGuildsOsuProfile, userid: scoreobj.userid, text: newscore.text});
                                    }
                                }
                            }
                        }
                    }

                    //проверка активности
                    log(`Проверка активности в осу у ${osuUserDataNew.username}`, moduleName)
                    let activities = await v2.user.activity(osuUserDataNew.userid, {limit: stalkerActivitiesLimit});

                    for (let activity of activities){
                        let newactivity;
                        switch (activity.type){
                            case `rank`:
                            case `rankLost`:
                                if (activity.type === `rankLost` || (activity.type === `rank` && activity.rank<stalkerScoresMinimumPlace) ){
                                    newactivity = await cheackAndSaveNewActivity(osuUserDataNew.userid, activity);
                                    if (newactivity !== false){
                                        if (isSilent == false){
                                            stalkerEvents.emit('newScore', {guildids: trackingsGuildsOsuProfile, userid: osuUserDataNew.userid, text: getActivityText(osuUserDataNew, activity)});
                                        }
                                    }
                                }
                                break
                            case `userSupportGift`:
                            case `userSupportAgain`:
                            case `achievement`:
                            case `beatmapsetUpdate`:
                            case `beatmapsetUpload`:
                            case `beatmapsetApprove`:
                            case `beatmapsetRevive`:
                            case `beatmapsetDelete`:
                            case `usernameChange`:
                                newactivity = await cheackAndSaveNewActivity(osuUserDataNew.userid, activity);
                                if (newactivity !== false){
                                    if (isSilent == false){
                                        stalkerEvents.emit('newOsuActivity', {guildids: trackingsGuildsOsuProfile, userid: osuUserDataNew.userid, text: getActivityText(osuUserDataNew, activity)});
                                    }
                                }
                                break
                            default:
                                console.log(`необработаный тип активности: ${activity.type}\n`, activity);
                        }
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },

}

function getUserSummary(osu_userInfo){
    function getLastYearCount(userinfo_playcounts){
        var last_year = 0;
        if (userinfo_playcounts.length>0){
            for (let i = 12; i > 0; i--){
                if(userinfo_playcounts.length-i>0){
                    last_year += userinfo_playcounts[userinfo_playcounts.length-i].count;
                }
            }
        }
        return last_year;
    }
    var res = {};
    res.id = Number(osu_userInfo.id);
    res.username = osu_userInfo.username;
    res.pp = getFixedFloat(osu_userInfo.statistics.pp,2);
    res.rank = osu_userInfo.statistics.global_rank;
    res.acc = getFixedFloat(osu_userInfo.statistics.hit_accuracy,2);
    res.countryrank = osu_userInfo.statistics.country_rank;
    res.lastvisit = osu_userInfo.last_visit;
    res.online = osu_userInfo.is_online===true?'online':'offline';
    res.followers = osu_userInfo.follower_count;
    res.gamemode = osu_userInfo.playmode;
    res.country = osu_userInfo.country.name;
    res.playcount = {
        total: osu_userInfo.beatmap_playcounts_count,
        last_month: osu_userInfo.monthly_playcounts[osu_userInfo.monthly_playcounts.length-1].count,
        last_year: getLastYearCount(osu_userInfo.monthly_playcounts)
    };
    
    return res;
}

async function addNewScore(scoreobj){
    var scoredata = await MYSQL_GET_ONE('osuscore', {scoreid: scoreobj.scoreid});
    if (scoredata === null){
        let newscore = {id: scoreobj.scoreid, score: scoreobj, text: getScoreText(scoreobj)};
        await MYSQL_SAVE('osuscore', { scoreid: scoreobj.scoreid }, scoreobj );
        return newscore;
    }
    return false;
}

function getActivityText(user, activity){
    var text = '';
    switch (activity.type){
        case `rank`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `занял **#${activity.rank}** место с ранком **${activity.scoreRank}**\n`;
            text += `На карте [${activity.beatmap.title}](https://osu.ppy.sh${activity.beatmap.url}) (${activity.mode})\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `rankLost`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `потерял лидерство\n`;
            text += `На карте [${activity.beatmap.title}](https://osu.ppy.sh${activity.beatmap.url}) (${activity.mode})\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `userSupportGift`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `получил тег **osu!supporter** в подарок!\n`
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `userSupportAgain`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `решил снова **поддержать osu!** - спасибо за вашу щедрость!\n`
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `achievement`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `получил медаль «**${activity.achievement.name}**»! (${activity.achievement.mode})\n`;
            text += `Категория: **${activity.achievement.grouping}**\n`;
            text += `Описание: ${activity.achievement.description}\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `beatmapsetUpdate`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `обновил карту [${activity.beatmapset.title}](https://osu.ppy.sh${activity.beatmapset.url})\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `beatmapsetUpload`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `опубликовал карту [${activity.beatmapset.title}](https://osu.ppy.sh${activity.beatmapset.url})\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `beatmapsetRevive`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `пробудил карту [${activity.beatmapset.title}](https://osu.ppy.sh${activity.beatmapset.url}) из вечного сна\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `beatmapsetDelete`:
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `удалил карту ${activity.beatmapset.title}\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `beatmapsetApprove`:
            let approvalType = activity.approval;
            if (approvalType === 'qualified') approvalType = `квалифицированой`;
            if (approvalType === 'ranked') approvalType = `рейтинговой`;
            if (approvalType === 'loved') approvalType = `любимой`;
            if (approvalType === 'approved') approvalType = `одобреной`;
            text += `**[${user.username}](https://osu.ppy.sh/users/${user.userid})**\n`;
            text += `Карта [${activity.beatmapset.title}](https://osu.ppy.sh${activity.beatmapset.url}) стала ${approvalType}!\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        case `usernameChange`:
            text += `**[${activity.user.previousUsername}](https://osu.ppy.sh/users/${user.userid})** `;
            text += `изменил ник на **[${activity.user.username}](https://osu.ppy.sh/users/${user.userid})**\n`;
            text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;
            break
        default:
            text += `необработаный тип активности: ${activity.type}`;
    }
    return text
}

async function cheackAndSaveNewActivity(userid, activitydata){
    var activity = await MYSQL_GET_ONE('osuactivity', {activityid: activitydata.id});
    if (activity === null){
        let activity_data_save = {
            activityid: activitydata.id,
            date: Math.trunc(new Date(activitydata.created_at).valueOf()/1000),
            type: activitydata.type,
            userid: userid
        }
        await MYSQL_SAVE('osuactivity', { activityid: activitydata.id }, activity_data_save );
        return activity_data_save;
    }
    return false;
}

function getScoreText(scoreObject){
    var scoreurl = `https://osu.ppy.sh/scores/${scoreObject.gamemode}/${scoreObject.scoreid}`;
    var text = `**[${scoreObject.username}](https://osu.ppy.sh/users/${scoreObject.userid})** сделал [новый скор](${scoreurl}) в **${scoreObject.gamemode}**:\n`;
    var mapurl = `https://osu.ppy.sh/beatmapsets/${scoreObject.mapsetid}#${scoreObject.gamemode}/${scoreObject.mapid}`;
    text += `Карта: [${scoreObject.artist} - ${scoreObject.title} [${scoreObject.diff}]](${mapurl})\n`
    if (scoreObject.mods !== ''){
        text += `Моды: **${scoreObject.mods}**\n`;
    }
    text += `Ранк: **${scoreObject.rank}**\n`;
    text += `Пеппи поинтс: **${getFixedFloat(scoreObject.pp*0.01,2)} pp**\n`;
    text += `Точность: **${getFixedFloat(scoreObject.acc*0.01,2)} %**\n`;
    text += `300/100/50/Miss: **${scoreObject.score300}/${scoreObject.score100}/${scoreObject.score50}/${scoreObject.score0}**\n`;
    text += `Совершен в: **${getTimeMSKToStringFormat(new Date(scoreObject.date*1000))}** ${getDiscordRelativeTime(scoreObject.date*1000)}\n`;
    return text;
}

function getScoreObject (score){
    var res = {};
    res.userid = score.user.id;
    res.username = score.user.username;
    res.scoreid = score.id;
    res.gamemode = score.mode;
    res.acc = parseInt(getFixedFloat(score.accuracy,4)*10000);
    res.pp = parseInt(getFixedFloat(score.pp,2)*100);
    res.score300 = score.statistics.count_300;
    res.score100 = score.statistics.count_100;
    res.score50 = score.statistics.count_50;
    res.score0 = score.statistics.count_miss;
    res.mapsetid = score.beatmap.beatmapset_id;
    res.mapid = score.beatmap.id;
    res.date = new Date(score.created_at).valueOf()/1000;
    //res.purepp = score.weight.pp;
    res.rank = score.rank;
    res.mods = score.mods.join("+");
    res.artist = score.beatmapset.artist;
    res.title = score.beatmapset.title;
    res.diff = score.beatmap.version;
    return res;
}

function getTextByOsuUserSummary(sum){
    var text = '';
    
    text += `Профиль игрока: **[${sum.username}](https://osu.ppy.sh/users/${sum.id})** **(${sum.gamemode})**\n`;
    if (sum.rank !== 'null' && sum.rank !== null && isNaN(sum.rank) !== true){
        text += `Ранк: **#${sum.rank}** (**#${sum.countryrank}** ${sum.country}) \n`;
    } else {
        text += `Ранк **не установлен** (${sum.country})\n`;
    }
    text += `Пеппи поинтс: **${getFixedFloat(sum.pp,2)} pp**\n`;
    text += `Точность: **${getFixedFloat(sum.acc,2)} %**\n`;
    text += `Плейкаунт (всего/год/месяц): **${sum.playcount.total}**(${sum.gamemode})/**${sum.playcount.last_year}**/**${sum.playcount.last_month}**\n`;
    text += `Подписчиков: **${sum.followers}**\n`;
    text += `Состояние: ${sum.online==='online'?':green_circle:':':red_circle:'} **${sum.online}**\n`;
    
    text += `Последний раз заходил в: **${getTimeMSKToStringFormat(new Date(sum.lastvisit))} (по МСК)**\n`;
    text += `${getDiscordRelativeTime(sum.lastvisit)}\n`;
    return text;
}