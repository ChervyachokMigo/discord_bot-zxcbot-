const fs = require('fs');

const {log} = require('./tools/log.js');
const {GET_VALUES_FROM_OBJECT_BY_KEY, onlyUnique} = require('./modules/tools.js');
const { guild_setting_events_deps } = require('./constantes/guild_setting_events_deps.js');

var settings = {};

function check_values(){
    const start_counts = Object.keys(settings).length;

    if (typeof settings.trovo_status_toggle === 'undefined') {
        settings.trovo_status_toggle = false;
    }
    if (typeof settings.twitch_status_toggle === 'undefined') {
    settings.twitch_status_toggle = true;
    }
    if (typeof settings.twitch_clips_toggle === 'undefined') {
    settings.twitch_clips_toggle = true;
    }
    if (typeof settings.youtube_toggle === 'undefined') {
    settings.youtube_toggle = false;
    }
    if (typeof settings.osu_profile_toggle === 'undefined') {
    settings.osu_profile_toggle = true;
    }
    if (typeof settings.twitch_followers_toggle === 'undefined') {
    settings.twitch_followers_toggle = false;
    }
    if (typeof settings.trovo_followers_toggle === 'undefined') {
    settings.trovo_followers_toggle = false;
    }
    if (typeof settings.trovo_clips_toggle === 'undefined') {
    settings.trovo_clips_toggle = false;
    }
    if (typeof settings.steam_status_toggle === 'undefined') {
    settings.steam_status_toggle = false;
    }
    if (typeof settings.twitch_chat_toggle === 'undefined') {
    settings.twitch_chat_toggle = true;
    }
    if (typeof settings.vk_status_toggle === 'undefined') {
    settings.vk_status_toggle = false;
    }
    if (typeof settings.vk_friends_toggle === 'undefined') {
    settings.vk_friends_toggle = false;
    }
    if (typeof settings.osu_followers_toggle === 'undefined') {
    settings.osu_followers_toggle = false;
    }
    if (typeof settings.records_toggle === 'undefined') {
    settings.records_toggle = false;
    }
    if (typeof settings.daily_toggle === 'undefined') {
    settings.daily_toggle = true;
    }
    if (typeof settings.role_buy_toggle === 'undefined') {
    settings.role_buy_toggle = true;
    }
    if (typeof settings.rewards_toggle === 'undefined') {
    settings.rewards_toggle = true;
    }
    if (typeof settings.give_toggle === 'undefined') {
    settings.give_toggle = true;
    }
    if (typeof settings.welcoming_toggle === 'undefined') {
    settings.welcoming_toggle = false;
    }
    if (typeof settings.balance_toggle === 'undefined') {
    settings.balance_toggle = true;
    }
    if (typeof settings.stalker_toggle === 'undefined') {
    settings.stalker_toggle = true;
    }
    if (typeof settings.time_toggle === 'undefined') {
    settings.time_toggle = false;
    }
    if (typeof settings.saymyname_toggle === 'undefined') {
    settings.saymyname_toggle = false;
    }
    if (typeof settings.sum_toggle === 'undefined') {
    settings.sum_toggle = true;
    }
    if (typeof settings.translate_toggle === 'undefined') {
    settings.translate_toggle = true;
    }
    if (typeof settings.reaction_roles_toggle === 'undefined') {
    settings.reaction_roles_toggle = true;
    }
    if (typeof settings.voice_roles_toggle === 'undefined') {
    settings.voice_roles_toggle = true;
    }
    if (typeof settings.reminds_toggle === 'undefined') {
    settings.reminds_toggle = true;
    }
    if (typeof settings.restricts_toggle === 'undefined') {
    settings.restricts_toggle = true;
    }
    if (typeof settings.joiner_toggle === 'undefined') {
    settings.joiner_toggle = true;
    }
    if (typeof settings.osu_replay_toggle === 'undefined') {
    settings.osu_replay_toggle = true;
    }      
    if (typeof settings.crypto_toggle === "undefined") {
        settings.crypto_toggle = true;
    }
    if (typeof settings.taiko_map_recomend_toggle === "undefined") {
        settings.taiko_map_recomend_toggle = true;
    }
    if (typeof settings.websettings_toggle === "undefined") {
        settings.websettings_toggle = true;
    }
    if (typeof settings.coins_daily_reward === "undefined") {
        settings.coins_daily_reward = 1000;
    }
    if (typeof settings.daily_WaitTime === "undefined") {
        settings.daily_WaitTime = 86400;
    }
    if (typeof settings.coins_max === "undefined") {
        settings.coins_max = 2000000000; //INT 32 bits max
    }
    if (typeof settings.stalkerRefreshRate === "undefined") {
        settings.stalkerRefreshRate = 135;
    }
    if (typeof settings.stalkerOsuScoresRefreshRate === "undefined") {
        settings.stalkerOsuScoresRefreshRate = 14400;
    }
    if (typeof settings.stalkerClipsTwitchRefreshRate === "undefined") {
        settings.stalkerClipsTwitchRefreshRate = 1800;
    }
    if (typeof settings.stalkerSteamProfilesRefreshRate === "undefined") {
        settings.stalkerSteamProfilesRefreshRate = 140;
    }
    if (typeof settings.stalkerVKProfilesRefreshRate === "undefined") {
        settings.stalkerVKProfilesRefreshRate = 290;
    }
    if (typeof settings.stalkerChatRefreshRate === "undefined") {
        settings.stalkerChatRefreshRate = 10;
    }
    if (typeof settings.stalkerClipsTrovoRefreshRate === "undefined") {
        settings.stalkerClipsTrovoRefreshRate = 1800;
    }
    if (typeof settings.stalkerYoutubeRefreshRate === "undefined") {
        settings.stalkerYoutubeRefreshRate = 1800;
    }
    if (typeof settings.stalkerVKFollowersRefreshRate === "undefined") {
        settings.stalkerVKFollowersRefreshRate = 86388;
    }
    if (typeof settings.stalkerTrovoFollowersRefreshRate === "undefined") {
        settings.stalkerTrovoFollowersRefreshRate = 86402;
    }
    if (typeof settings.stalkerFollowersTwitchRefreshRate === "undefined") {
        settings.stalkerFollowersTwitchRefreshRate = 86407;
    }
    if (typeof settings.stalkerOsuFollowersRefreshRate === "undefined") {
        settings.stalkerOsuFollowersRefreshRate = 86412;
    }
    if (typeof settings.stalkerBestScoresLimit === "undefined") {
        settings.stalkerBestScoresLimit = 100;
    }
    if (typeof settings.stalkerActivitiesLimit === "undefined") {
        settings.stalkerActivitiesLimit = 100;
    }
    if (typeof settings.stalkerScoresMinimumPlace === "undefined") {
        settings.stalkerScoresMinimumPlace = 100;
    }
    if (typeof settings.stalkerMinScorePP === "undefined") {
        settings.stalkerMinScorePP = 0;
    }
    if (typeof settings.stalkerClipsCheckLastDays === "undefined") {
        settings.stalkerClipsCheckLastDays = 1; // 0.04 for the last hour, 0.5 for the last 12 hours, 1 for 1 day
    }
    if (typeof settings.twitchclipsTitleMinChars === "undefined") {
        settings.twitchclipsTitleMinChars = 12;
    }
    if (typeof settings.osu_replay_zoom_start === "undefined") {
    settings.osu_replay_zoom_start = 400;
    }
    if (typeof settings.osu_replay_zoom_inc === "undefined") {
    settings.osu_replay_zoom_inc = 50;
    }
    if (typeof settings.osu_replay_zoom_max === "undefined") {
    settings.osu_replay_zoom_max = 1000;
    }
    if (typeof settings.osu_replay_zoom_min === "undefined") {
    settings.osu_replay_zoom_min = 1;
    }
    if (typeof settings.osu_replay_time_start === "undefined") {
    settings.osu_replay_time_start = 0;
    }
    if (typeof settings.default_prefix === "undefined") {
    settings.default_prefix = "!";
    }
    if (typeof settings.coins_name === "undefined") {
    settings.coins_name = 'монеты';
    }
    if (typeof settings.stalkerTrovoClipsPeriod === "undefined") {
    settings.stalkerTrovoClipsPeriod = 'day';
    }
    if (typeof settings.OsuHunter_updateTime === "undefined") {
    settings.OsuHunter_updateTime = '12:00';
    }
    if (typeof settings.stalkerRecordsRoot === "undefined") {
    settings.stalkerRecordsRoot = `C:\\StreamRecords`;
    }
    if (typeof settings.stalkerClipsFolder === "undefined") {
    settings.stalkerClipsFolder = `C:\\ClipsDownloads`;
    }
    if (typeof settings.osuPath === "undefined") {
    settings.osuPath = `E:\\osu!`;
    }
    if (typeof settings.osuBeatmapDownloadsDir === "undefined") {
    settings.osuBeatmapDownloadsDir = `data/osuBeatmapDownloads`;
    }
    if (typeof settings.osuNewBeatmapDir === "undefined") {
    settings.osuNewBeatmapDir = `data/osuNewBeatmaps`;
    }
    if (typeof settings.restricted_words === "undefined") {
    settings.restricted_words = [];
    }
    if (typeof settings.restricted_links === "undefined") {
    settings.restricted_links = [];
    }

    const end_counts = Object.keys(settings).length;
    if (end_counts > start_counts){
        console.log('saving new settings');
        fs.writeFileSync('../settings.json', JSON.stringify(settings));
    }
}

const load = ()=>{
    log('loading settings.js');
    try{
        settings = fs.readFileSync('../settings.json', 'utf8');
        settings = JSON.parse(settings);
        check_values();
        
    } catch (err){
        switch(err.code){
            case 'ENOENT':
                console.log('settings.json not found');
                console.log('set default values of settings.json');
    
                check_values();
                
                break;
            default:
                console.error(err);
                throw new Error(err);
        }
    }
}

load();

module.exports = {
    load: load,

    intents: ["GUILDS" ,"GUILD_MEMBERS" ,"GUILD_BANS" ,"GUILD_EMOJIS_AND_STICKERS" ,"GUILD_INTEGRATIONS" ,
    "GUILD_WEBHOOKS" ,"GUILD_INVITES" ,"GUILD_VOICE_STATES","GUILD_PRESENCES" ,"GUILD_MESSAGES" ,"GUILD_MESSAGE_REACTIONS" ,"GUILD_MESSAGE_TYPING" ,
    "DIRECT_MESSAGES" ,"DIRECT_MESSAGE_REACTIONS" ,"DIRECT_MESSAGE_TYPING" ,"GUILD_SCHEDULED_EVENTS"],
    
    youtube_scopes: ['https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/userinfo.profile'],

    restrict_words: [{type:`links` ,    values: settings.restricted_links},
                     {type:`words`,     values: settings.restricted_words} ],

    available_guildSettings: ()=>{
        var res = [`prefix`,
            `crypto`,
            `osu_replay`
        ];
        return onlyUnique(res.concat(GET_VALUES_FROM_OBJECT_BY_KEY(guild_setting_events_deps, 'setting_name')));
    },

    AllowedNamesOfGuildChannels: ()=>{
        var res = [`system`,`general`,`daily`,`reminds`,`joiner`,
        `clear`, `crypto`, `mailer`, 'control', 'twitchchat_commands', 'twitchchat_mentions'];
        return onlyUnique(res.concat(GET_VALUES_FROM_OBJECT_BY_KEY(guild_setting_events_deps, 'channel')));
    },

    AllowedChannelsStartedWith: ['twitchchat'],

    stalkerClipsFolder: settings.stalkerClipsFolder,
    stalkerRecordsRoot: settings.stalkerRecordsRoot,
    osuPath: settings.osuPath,
    osuBeatmapDownloadsDir: settings.osuBeatmapDownloadsDir,
    osuNewBeatmapDir: settings.osuNewBeatmapDir,

    default_prefix : settings.default_prefix,

    coins_name : settings.coins_name,

    coins_daily_reward : settings.coins_daily_reward,
    daily_WaitTime :  settings.daily_WaitTime,
    coins_max : settings.coins_max, 
    

    stalkerRefreshRate: settings.stalkerRefreshRate,
    stalkerOsuScoresRefreshRate:  settings.stalkerOsuScoresRefreshRate,
    stalkerClipsTwitchRefreshRate: settings.stalkerClipsTwitchRefreshRate,
    stalkerSteamProfilesRefreshRate:  settings.stalkerSteamProfilesRefreshRate,
    stalkerVKProfilesRefreshRate: settings.stalkerVKProfilesRefreshRate,
    stalkerChatRefreshRate: settings.stalkerChatRefreshRate,
    stalkerClipsTrovoRefreshRate: settings.stalkerClipsTrovoRefreshRate,
    stalkerYoutubeRefreshRate: settings.stalkerYoutubeRefreshRate,

    stalkerVKFollowersRefreshRate: settings.stalkerVKFollowersRefreshRate,
    stalkerTrovoFollowersRefreshRate: settings.stalkerTrovoFollowersRefreshRate,
    stalkerFollowersTwitchRefreshRate: settings.stalkerFollowersTwitchRefreshRate,
    stalkerOsuFollowersRefreshRate: settings.stalkerOsuFollowersRefreshRate,

    stalkerBestScoresLimit: settings.stalkerBestScoresLimit,
    stalkerActivitiesLimit: settings.stalkerActivitiesLimit,
    stalkerScoresMinimumPlace: settings.stalkerScoresMinimumPlace,
    stalkerMinScorePP: settings.stalkerMinScorePP,

    stalkerClipsCheckLastDays: settings.stalkerClipsCheckLastDays,
    
    stalkerTrovoClipsPeriod: settings.stalkerTrovoClipsPeriod,
    twitchclipsTitleMinChars: settings.twitchclipsTitleMinChars,

    osu_replay_zoom_start:  settings.osu_replay_zoom_start,
    osu_replay_zoom_inc: settings.osu_replay_zoom_inc,
    osu_replay_zoom_max: settings.osu_replay_zoom_max,
    osu_replay_zoom_min: settings.osu_replay_zoom_min,

    osu_replay_time_start: settings.osu_replay_time_start,

    OsuHunter_updateTime: settings.OsuHunter_updateTime,

    modules: {
        time: settings.time_toggle,         //выводит время по Москве
        saymyname: settings.saymyname_toggle,    //выводит свой профиль айди
        sum: settings.sum_toggle,          //сумма чисел
        translate: settings.translate_toggle,    //перевод раскладки
        balance: settings.balance_toggle,      //модуль баланса

        reactionroles: settings.reaction_roles_toggle, //выдача ролей по реаакции на сообщение
        voiceroles: settings.voice_roles_toggle,   //привязка роли к войс каналу
        remind: settings.reminds_toggle,       //напоминалка

        restrict: settings.restricts_toggle,

        stalker: settings.stalker_toggle,
        joiner:  settings.joiner_toggle,

        osu_replay: settings.osu_replay_toggle,
        crypto: settings.crypto_toggle,
        taiko_map_recomend: settings.taiko_map_recomend_toggle,

        websettings: settings.websettings_toggle
    },

    modules_stalker: {
        twitchstatus: settings.twitch_status_toggle,
        osuprofile: settings.osu_profile_toggle,
        twitchclips: settings.twitch_clips_toggle,
        youtube: settings.youtube_toggle,
        trovostatus: settings.trovo_status_toggle,

        twitchfollowers: settings.twitch_followers_toggle,
        trovofollowers: settings.trovo_followers_toggle ,
        trovoclips: settings.trovo_clips_toggle,
        steamstatus: settings.steam_status_toggle,
        twitchchat: settings.twitch_chat_toggle,
        vkstatus: settings.vk_status_toggle,
        vkfriends: settings.vk_friends_toggle,
        osufollowers: settings.osu_followers_toggle,
        records: settings.records_toggle,
    },

    modules_balance: {
        daily: settings.daily_toggle,        //выдать денег раз в день
        rolebuy: settings.role_buy_toggle,      //купить роль
        reward: settings.rewards_toggle,       //подарить денег (админ)
        give: settings.give_toggle,         //передать денег другому
    },
    sendBotAppears: settings.welcoming_toggle,

}