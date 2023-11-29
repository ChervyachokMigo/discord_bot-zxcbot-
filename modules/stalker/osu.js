const { v2 } = require ('osu-api-extended');

const {  MYSQL_GET_TRACKING_DATA_BY_ACTION, manageGuildServiceTracking, 
    getTrackingInfo, getGuildidsOfTrackingUserService } = require("../DB.js");

const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_GET_ALL } = require("../DB/base.js");

const { getTimeMSKToStringFormat, timeAgo, getDiscordRelativeTime } = require('../../tools/time.js');
const { getNumberWithSign, getFixedFloat } = require("../../modules/tools.js");
const { LogString, log } = require("../../tools/log.js");
const { SendAnswer, SendError } = require("../../tools/embed.js")

const { checkTokenExpires } = require (`../../modules/stalker/requests.js`);

const { stalkerOsuScoresRefreshRate, 
    stalkerBestScoresLimit, 
    stalkerMinScorePP, 
    stalkerActivitiesLimit, 
    stalkerScoresMinimumPlace, 
    osu_md5_stock} = require('../../settings.js');
const { emoji_osu } = require("../../constantes/emojis.js");
const fs = require('fs');
const path = require('path');
const { default: axios } = require('axios');
const crypto = require('crypto');
const { spawnSync, spawn } = require('child_process');
const { saveError } = require('../logserver/index.js');

//const { GetGamemodeToInt, get_beatmap_pps_by_id } = require('../DB/beatmaps.js');

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
        return {error: null}
    }

    return {
        userid: Number(data.id),
        username: data.username,
        pp: parseInt(getFixedFloat(data.statistics.pp, 2)*100),
        rank: parseInt(data.statistics.global_rank),
        acc: parseInt(getFixedFloat(data.statistics.hit_accuracy,2)*100),
        countryrank: parseInt(data.statistics.country_rank),
        lastactive: parseInt(new Date(data.last_visit).valueOf()/1000),
        online: data.is_online,
        followers: parseInt(data.follower_count),
        mainmode: data.playmode,
        avatar: data.avatar_url
    };
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

async function get_beatmap_info_bancho (beatmapset_id) {
    if (!await checkTokenExpires('osu')){
        log('cant get osu token');
        return false;
    };
    const beatmapset_info = await v2.beatmap.set.details(beatmapset_id);

    if (beatmapset_info.error){
        return false;
    }

    return beatmapset_info;
}

async function get_score_info_bancho (score_id, gamemode) {
    if (!await checkTokenExpires('osu')){
        log('cant get osu token');
        return false;
    };

    const score_info = await v2.scores.details(score_id, gamemode);

    if (score_info.error){
        return false;
    }

    return score_info;
}

const get_beatmap_info_by_md5 = (md5) => {
    const filepath = path.join(osu_md5_stock, `${md5}.osu`);

    if (fs.existsSync(filepath)){
        const data = fs.readFileSync( filepath, {encoding: 'utf8'} );
        const beatmapid_match = data.match( /beatmapid:[ ]*([0-9]*)/i);
        const beatmapsetid_match = data.match( /beatmapsetid:[ ]*([0-9]*)/i);
        const title_match = data.match( /title:(.*)/i);
        const artist_match = data.match( /artist:(.*)/i);
        if (beatmapsetid_match && beatmapid_match && artist_match && title_match){
            if (beatmapsetid_match[1] && beatmapid_match[1] && artist_match[1] && title_match[1]){
                return {
                    beatmapid: parseInt(beatmapid_match[1]), 
                    beatmapsetid: parseInt(beatmapsetid_match[1]),
                    title: title_match[1].trim(),
                    artist: artist_match[1].trim()
                };
            }
        }
    }
    return null;
}

const get_performance_points_beatmap = ( md5 ) => {
    const filepath = path.join('.\\data\\beatmaps_data', `${md5}.json`);
    if (fs.existsSync(filepath)){
        return JSON.parse(fs.readFileSync(filepath));
    }
    return null;
}

const get_performance_points_beatmap_mysql = async ({ md5, mods = 0 }) => {
    const maps = await MYSQL_GET_ALL('osu_beatmap_pp', { md5, mods });

    if (!maps || maps.length === 0) {
        return null;
    }

    return maps;
}

const get_not_existed_beatmap = async (info) => {
    
    return new Promise( async (res) => {
        //const url = `https://osu.ppy.sh/${info.beatmapset_mode}/${info.id}`;
        const url = `https://osu.ppy.sh/osu/${info.id}`;
        await axios.get( url ).then( response => {
            if (response && response.data) {
                const md5 = crypto.createHash('md5').update(response.data).digest("hex");
                if (md5 === info.md5){
                    fs.writeFileSync(path.join(osu_md5_stock,`${md5}.osu`), response.data);
                    const mode = info.mode === 'fruits'? 'catch': info.mode;
                    res( calc_diffs({ md5, mode }) );
                } else {
                    res({ error: 'beatmap md5 not valid' });
                }
            } else {
                res({ error: 'no response from bancho' });
            }
        }).catch( err => {
            res({ error: err.toString() });
        });
    });

}

const actions = [
    {acc: '100'}, 
    {acc: '99'}, 
    {acc: '98'}, 
    {acc: '95'}
]

const output_path = '.\\data\\beatmaps_data\\';

const calc_diffs = (args) => {
    
    const results = actions.map( (val) => calc_acc( {...args, ...val} ));

    if (results.length === actions.length){
        fs.writeFileSync(path.join(output_path, `${args.md5}.json`), JSON.stringify( results.map( val => val ) ), { encoding: 'utf8' });
        return { pps: results };
    };

}

const calc_exe = path.join(__dirname,'../../bin/pp_calculator/PerformanceCalculator.exe');

const calc_acc = ({md5, mode, acc}) => {
    let acc_args = `-a ${acc}`;

    if (mode === 'mania'){
        acc_args = `-s ${acc * 10000}`
    }

    const { stdout, stderr } = spawnSync( calc_exe, [
        'simulate', 
        mode, 
        '-j',
        `${path.join(osu_md5_stock, `${md5}.osu`)}`,
        acc_args,
    ], {windowsHide: true});

    if (stderr && stderr.length > 0) {
        console.error(md5, mode, acc);
        console.log(stderr.toString());
        saveError(['beatmaps_info.js','calc_acc',md5, mode, acc, stderr.toString()].join(' > '));
        throw 'error';
    }

    return JSON.parse(stdout);
}

module.exports = {
    getOsuUserData: getOsuUserData,
    get_beatmap_info_by_md5:get_beatmap_info_by_md5,

    getBeatmapInfoByUrl: async (url) => {

        const url_parts = url.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/([0-9]+)(\#([A-Za-z]+)\/([0-9]+)?)*/i );

        if (url_parts === null) {
            return {error: `ссылка не битмапсет`};
        }

        

        const request = {
            beatmapset_id: url_parts[1]? Number(url_parts[1]): null,
            gamemode: url_parts[3]? GetGamemodeToInt(url_parts[3]): null,
            beatmap_id: url_parts[4]? Number(url_parts[4]): null
        };

        if ( ! (request.beatmapset_id && request.beatmap_id) ){
            return { error: `ссылка не полная` };
        }

        let beatmap_pps = await get_beatmap_pps_by_id({...request });
        beatmap_pps.sort( (a, b) => b.accuracy - a.accuracy );
        /*if (!beatmap){
            const beatmapset_info = await get_beatmap_info_bancho( request.beatmapset_id );

            if (!beatmapset_info){
                return {error: `невозможно получить информацию о карте с банчо ${request.beatmapset_id}`};
            }

            beatmap = beatmapset_info.beatmaps.find( b => Number(b.id) === Number(request.beatmap_id));

            if ( !beatmap ) {
                return {error: `карта ${request.beatmap_id} не найдена в битмапсете ${request.beatmapset_id}`};
            }

            beatmap.beatmap_id = beatmap.id;
            beatmap.title = beatmapset_info.title;
            beatmap.artist = beatmapset_info.artist;
            beatmap.difficulty = beatmap.version;
            beatmap.creator = beatmapset_info.creator;
            beatmap.gamemode = beatmap.mode;
            beatmap.ranked = beatmap.status;
            beatmap.md5 = beatmap.checksum;
        }*/
        
       // const beatmap_pps = await get_performance_points_beatmap_mysql({ md5: beatmap.md5 });

        //let  pps = [];

        if (beatmap_pps.length === 0) {
            /*const result = await get_not_existed_beatmap({
                id: Number(request.beatmap_id) , 
                md5: md5, 
                mode: request.gamemode });

            if (result.error) {
                console.error(result.error);
            } else {
                pps = result.pps.map ( calc_info => { return {
                    acc: Math.round(calc_info.score.accuracy),
                    pp: Math.round(calc_info.performance_attributes.pp)
                }});
                
            }*/
            return {error: `карта ${request.beatmap_id} не найдена`};
        }

        return {success: {
                url: url_parts[0], pps: beatmap_pps
                /*id: beatmap.beatmap_id,
                md5: beatmap.md5,
                artist: beatmap.artist, 
                title: beatmap.title,
                diff: beatmap.difficulty,
                creator: beatmap.creator,
                mode: beatmap.gamemode,
                status: beatmap.ranked,*/
                //length: beatmap.hit_length,
                //max_combo: beatmap.max_combo,
                //bpm: beatmap.bpm,
                //stars: beatmap.difficulty_rating,
                //ar: beatmap.ar,
                //cs: beatmap.cs,
                //od: beatmap.accuracy,
                //hp: beatmap.drain,
                //beatmapset_mode: request.gamemode,
                //pps
            }
        }
    },

    getScoreInfoByUrl: async (url) => {
        
        const url_parts = url.match(/https:\/\/osu\.ppy\.sh\/scores\/([A-Za-z]+)\/([0-9]+)*/i );

        if (url_parts === null) {
            return {error: `ссылка не скор`};
        }

        const request = {
            gamemode: url_parts[1],
            score_id: url_parts[2]
        };

        if ( ! (request.gamemode && request.score_id) ){
            return {error: `ссылка не полная`};
        }

        const score_info = await get_score_info_bancho(request.score_id, request.gamemode);

        if ( ! score_info){
            return {error: `невозможно получить информацию о скоре с банчо ${request.score_id} или он не существует`};
        }

        return {success: {
                username: score_info.user.username,
                mode: score_info.mode,
                rank: score_info.rank,
                rank_global: score_info.rank_global,
                mods:  score_info.mods.length === 0? 'No Mods': score_info.mods.join('+'),
                accuracy: (Math.round(Number(score_info.accuracy) * 10000) / 100).toFixed(2),
                score_combo: score_info.max_combo,
                beatmap_combo: score_info.beatmap.max_combo,
                pp: Math.round(Number(score_info.pp)),
                count300: score_info.statistics.count_300,
                count100: score_info.statistics.count_100,
                count50: score_info.statistics.count_50,
                countgeki: score_info.statistics.count_geki,
                countkatu: score_info.statistics.count_katu,
                count0: score_info.statistics.count_miss,
                beatmap_artist: score_info.beatmapset.artist,
                beatmap_title: score_info.beatmapset.title,
                beatmap_diff: score_info.beatmap.version,
                beatmap_creator: score_info.beatmapset.creator,
            }
        }
    },


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
        const fieldsMapping = [
            { name: 'User ID', key: 'userid' },
            { name: 'Username', key: 'username' }
        ];
        await getTrackingInfo(message, 'osuprofile', 'osuprofile', emoji_osu, moduleName, fieldsMapping);
    },

    MYSQL_OSU_USER_TRACKING_CHANGE: async function(message, userid, option){
        var user = isNaN( Number(userid))?{username:userid.toString()}:{userid:Number(userid)};
        
        //проверка юзера и создание нового юзера
        var userdata = await MYSQL_GET_ONE('osuprofile', user);
        if (userdata === null ) {
            var osuserdata = await getOsuUserData(user.username || user.userid,'osu');
            if (typeof osuserdata.userid === 'undefined' || osuserdata.error){
                return {success: false, text: `Osu user **${userid}** not exists`}
            }
            osuserdata.tracking = Boolean(option.value);
            await MYSQL_SAVE('osuprofile', { userid: osuserdata.userid }, osuserdata);
            userdata = osuserdata;
            
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

        var AllUsersOsuDataFromDB = await MYSQL_GET_TRACKING_DATA_BY_ACTION('osuprofile');

        if (AllUsersOsuDataFromDB.length > 0){

            log('Проверка осу фолловеров', moduleName);

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

            var AllUsersOsuDataFromDB = await MYSQL_GET_TRACKING_DATA_BY_ACTION('osuprofile');
            
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
                    let topscores = await v2.scores.user.category(osuUserDataNew.userid, "best", {limit: stalkerBestScoresLimit});

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
                                log(`необработаный тип активности: ${activity.type}\n`, 'Osu');
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
    var res = {
        id: Number(osu_userInfo.id),
        username: osu_userInfo.username,
        pp: getFixedFloat(osu_userInfo.statistics.pp,2),
        rank: osu_userInfo.statistics.global_rank,
        acc: getFixedFloat(osu_userInfo.statistics.hit_accuracy,2),
        countryrank: osu_userInfo.statistics.country_rank,
        lastvisit: osu_userInfo.last_visit,
        online: osu_userInfo.is_online===true?'online':'offline',
        followers: osu_userInfo.follower_count,
        gamemode: osu_userInfo.playmode,
        country: osu_userInfo.country.name,
        playcount: {
            total: osu_userInfo.beatmap_playcounts_count,
            last_month: osu_userInfo.monthly_playcounts[osu_userInfo.monthly_playcounts.length-1].count,
            last_year: getLastYearCount(osu_userInfo.monthly_playcounts)
        }
    }
    
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

    function username_link(username, userid){
        return `**[${username}](https://osu.ppy.sh/users/${userid})**`;
    }

    function beatmap_link(title, relative_url){
        return `[${title}](https://osu.ppy.sh${relative_url})`;
    }

    var text = ``;

    switch (activity.type){

        case `rank`:
            text += `${username_link(user.username,user.userid)} занял **#${activity.rank}** место с ранком **${activity.scoreRank}**\n`;
            text += `На карте ${beatmap_link(activity.beatmap.title, activity.beatmap.url)} (${activity.mode})\n`;
            break

        case `rankLost`:
            text += `${username_link(user.username,user.userid)} потерял лидерство\n`;
            text += `На карте ${beatmap_link(activity.beatmap.title, activity.beatmap.url)} (${activity.mode})\n`;
            break

        case `userSupportGift`:
            text += `${username_link(user.username,user.userid)} получил тег **osu!supporter** в подарок!\n`
            break

        case `userSupportAgain`:
            text += `${username_link(user.username,user.userid)} решил снова **поддержать osu!** - спасибо за вашу щедрость!\n`
            break

        case `achievement`:
            text += `${username_link(user.username,user.userid)} получил медаль «**${activity.achievement.name}**»! (${activity.achievement.mode})\n`;
            text += `Категория: **${activity.achievement.grouping}**\n`;
            text += `Описание: ${activity.achievement.description}\n`;
            break

        case `beatmapsetUpdate`:
            text += `${username_link(user.username,user.userid)} обновил карту ${beatmap_link(activity.beatmap.title, activity.beatmap.url)}\n`;
            break

        case `beatmapsetUpload`:
            text += `${username_link(user.username,user.userid)} опубликовал карту ${beatmap_link(activity.beatmap.title, activity.beatmap.url)}\n`;
            break

        case `beatmapsetRevive`:
            text += `${username_link(user.username,user.userid)} пробудил карту ${beatmap_link(activity.beatmap.title, activity.beatmap.url)} из вечного сна\n`;
            break

        case `beatmapsetDelete`:
            text += `${username_link(user.username,user.userid)} удалил карту ${activity.beatmapset.title}\n`;
            break

        case `beatmapsetApprove`:
            let approvalType = activity.approval;
            if (approvalType === 'qualified') approvalType = `квалифицированой`;
            if (approvalType === 'ranked') approvalType = `рейтинговой`;
            if (approvalType === 'loved') approvalType = `любимой`;
            if (approvalType === 'approved') approvalType = `одобреной`;
            text += `Сделаная ${username_link(user.username,user.userid)} карта ${beatmap_link(activity.beatmap.title, activity.beatmap.url)} стала ${approvalType}!\n`;
            break

        case `usernameChange`:
            text += `${username_link(activity.user.previousUsername,user.userid)} изменил ник на ${username_link(activity.user.username,user.userid)}\n`;
            break

        default:
            text += `необработаный тип активности: ${activity.type}`;
    }

    text += `Дата: ${getDiscordRelativeTime(activity.created_at)}`;

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
    return {
        userid: score.user.id,
        username: score.user.username,
        scoreid: score.id,
        gamemode: score.mode,
        acc: parseInt(getFixedFloat(score.accuracy,4)*10000),
        pp: parseInt(getFixedFloat(score.pp,2)*100),
        score300: score.statistics.count_300,
        score100: score.statistics.count_100,
        score50: score.statistics.count_50,
        score0: score.statistics.count_miss,
        mapsetid: score.beatmap.beatmapset_id,
        mapid: score.beatmap.id,
        date: new Date(score.created_at).valueOf()/1000,
        rank: score.rank,
        mods: score.mods.join("+"),
        artist: score.beatmapset.artist,
        title: score.beatmapset.title,
        diff: score.beatmap.version
    };
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