//посты в вк
//ютуб
//чат в трово
//клипы в осу категгории на твиче

//иконки картинки всякие

//выключение модулей

//добавление в базу осу стааты

//сделать сколько стримил времени
//починить время сколько был оффлайн

//статистика

var {EventEmitter} = require('events');

var { getDiscordRelativeTime } = require('../tools/time.js');
const { getGuildChannelDB } = require (`../modules/GuildChannel.js`);
const { SendAnswer } = require("../tools/embed.js");
const { LogString, log , debug } = require("../tools/log.js");
const { setInfinityTimerLoop, ObjToString, getBooleanFromString } = require("../modules/tools.js");
const { getGuildSetting } = require('../modules/guildSettings.js');

const { checkTwitchStatus, checkUserTwitchFolowers, checkUserTwitchClips } = require (`../modules/stalker/twitch.js`);
const { checkTrovoStatus, checkTrovoLastClips, checkTrovoFollowers } = require (`../modules/stalker/trovo.js`);
const { checkChangesSteamUser } = require (`../modules/stalker/steam.js`);
const { checkVKstatus, checkVKfriends } = require (`../modules/stalker/VK.js`);
const { checkOsuData, checkOsuFollowers } = require (`../modules/stalker/osu.js`);
const youtube = require (`../modules/stalker/youtube.js`);

const {
  stalkerRefreshRate,
  stalkerClipsTwitchRefreshRate,
  stalkerFollowersTwitchRefreshRate,
  stalkerSteamProfilesRefreshRate,
  stalkerOsuScoresRefreshRate,
  stalkerVKProfilesRefreshRate,
  stalkerVKFollowersRefreshRate,
  stalkerClipsTrovoRefreshRate,
  stalkerOsuFollowersRefreshRate,
  stalkerTrovoFollowersRefreshRate,
  stalkerYoutubeRefreshRate,
} = require('../settings.js');

const {
    modules, 
    modules_stalker
} = require('../settings.js');

const { emoji_twitch, emoji_osu, emoji_vk, emoji_trovo, emoji_steam, emoji_youtube } = require("../constantes/emojis.js");

var stalkerEvents = new EventEmitter({captureRejections: true});

const moduleName = `Stalker info`;

module.exports = {
    StalkerStartListeners: async function (guild){

        stalkerEvents.on(`newScore`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'osu_scores')))) return false;
                var channel;
                switch (args.userid){
                    case 1389663: 
                        channel = await getGuildChannelDB( guild, 'talala_newscores' );
                    break;
                    case 9547517:
                        channel = await getGuildChannelDB( guild, 'sadgod_newscores' );
                    break;
                    default:
                        channel = await getGuildChannelDB( guild, 'newscores' );
                        break;
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_osu} Stalker Osu Scores`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`Новый осу скор!`);
            }
        });

        stalkerEvents.on(`newOsuActivity`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'osu_activity')))) return false;
                var channel;
                switch (args.userid){
                    case 1389663: 
                        channel = await getGuildChannelDB( guild, 'talala_newactivityies' );
                    break;
                    case 9547517:
                        channel = await getGuildChannelDB( guild, 'sadgod_newactivityies' );
                    break;
                    default:
                        channel = await getGuildChannelDB( guild, 'newactivityies' );
                        break;
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_osu} Stalker Osu Activites`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`Новая осу активность!`);
            }
        });

        stalkerEvents.on(`osuProfileChanges`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'osu_profiles')))) return false;
                var channel;
                switch (args.userid){
                    case 1389663: 
                        channel = await getGuildChannelDB( guild, 'talala_osuchanges' );
                        break;
                    case 9547517:
                        channel = await getGuildChannelDB( guild, 'sadgod_osuchanges' );
                        break;
                    default:
                        channel = await getGuildChannelDB( guild, 'osuchanges' );
                        break;
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_osu} Stalker Osu Profile`,
                    text:  args.text,
                    image: args.image } );
                LogString(guild.name,`info`, moduleName,`Изменения в осу профиле!`);
            }
        });

        stalkerEvents.on(`osuFollowersChanges`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'osu_followers')))) return false;
                var channel;
                switch (args.userid){
                    case 1389663: 
                        channel = await getGuildChannelDB( guild, 'talala_osufollowers' );
                        break;
                    case 9547517:
                        channel = await getGuildChannelDB( guild, 'sadgod_osufollowers' );
                        break;
                    default:
                        channel = await getGuildChannelDB( guild, 'osufollowers' );
                        break;
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_osu} Stalker Osu Followers`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`Изменения осу подписчиков!`);
            }
        });

        stalkerEvents.on(`steamUserProfileChanges`, async function (args){   
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'steam_profile')))) return false;
                if (args.userid === '76561198021506077'){
                    var channel = await getGuildChannelDB( guild, 'talala_steamchanges' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'steamchanges' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_steam} Stalker Steam Profile`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`Изменения в стим профиле!`);
            }
        });
        
        stalkerEvents.on(`StreamFolowers`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (args.platform === 'Twitch'){
                    if (!(getBooleanFromString(getGuildSetting(guild.id, 'twitch_followers')))) return false;
                    var title_emoji = emoji_twitch;
                    var text = `На канале **[${args.username}](https://www.twitch.tv/${args.username})** изменилось количество подписчиков на **${args.diff}**\nТеперь подписано **${args.count}** человек`;
                }
                if (args.platform === 'Trovo'){
                    if (!(getBooleanFromString(getGuildSetting(guild.id, 'trovo_followers')))) return false;
                    var title_emoji = emoji_trovo;
                    var text = `На канале **[${args.username}](https://trovo.live/s/${args.username})** изменилось количество подписчиков на **${args.diff}**\nТеперь подписано **${args.count}** человек`;
                }
                if (args.username === 'talalusha'){
                    var channel = await getGuildChannelDB( guild, 'talala_streamfollowers' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'streamfollowers' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${title_emoji} Stalker ${args.platform} Followers`,
                    text:  text } );
                LogString(guild.name,`info`, moduleName,`Изменения количества ${args.platform} подписчиков!`);
            }
        });

        stalkerEvents.on(`newClipTwitch`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'twitch_clips')))) return false;
                if (args.broadcaster_name === 'talalusha'){
                    var channel = await getGuildChannelDB( guild, 'talala_twitchclips' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'twitchclips' );
                }
                var text = `На канале **${args.broadcaster_name}** появился [новый клип](${args.url})\n`;
                text += `Название: **${args.title}**\n`;
                text += `Создатель: **${args.creator_name}**\n`;
                text += `Дата: ${getDiscordRelativeTime( args.created_at )}\n`;
                
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_twitch} Stalker Twitch Clips`,
                    text:  text } );
                LogString(guild.name,`info`, moduleName,`Новый клип на Twitch!`);
            }
        });

        stalkerEvents.on(`newClipTrovo`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'trovo_clips')))) return false;
                if (args.streamer_username === 'talalusha'){
                    var channel = await getGuildChannelDB( guild, 'talala_trovoclips' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'trovoclips' );
                }
                var text = `На канале **${args.streamer_username}** появился [новый клип](${args.url})\n`;
                text += `Название: **${args.title}**\n`;
                text += `Создатель: **${args.maker_username}**\n`;
                text += `Дата: ${getDiscordRelativeTime( args.made_at*1000 )}\n`;
                
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_trovo} Stalker Trovo Clips`,
                    text:  text } );
                LogString(guild.name,`info`, moduleName,`Новый клип на Trovo!`);
            }
        });
        
        stalkerEvents.on(`ChangeStreamStatus`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (args.platform === 'Twitch'){
                    if (!(getBooleanFromString(getGuildSetting(guild.id, 'twitch_status')))) return false;
                    var title_emoji = emoji_twitch;
                }
                if (args.platform === 'Trovo'){
                    if (!(getBooleanFromString(getGuildSetting(guild.id, 'trovo_status')))) return false;
                    var title_emoji = emoji_trovo;
                }
                if (args.username === 'talalusha'){
                    var channel = await getGuildChannelDB( guild, 'talala_streamstatus' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'streamstatus' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${title_emoji} Stalker ${args.platform} Status`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`${args.username} меняет статус на ${args.platform}`);
            }
        });

        stalkerEvents.on(`TwitchChattersOfEndStream`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'twitch_chatters')))) return false;
                if (args.chatters.TotalMessages>0){
                    var text = `Total Messages: **${args.chatters.TotalMessages}**\nTotal Users: **${Object.entries(args.chatters.Users).length}**\n${ObjToString(args.chatters.Users)}`;

                    var channel = await getGuildChannelDB( guild, 'streamstatus' );
                    
                    await SendAnswer( {channel: channel,
                        guildname: guild.name,
                        messagetype: `info`,
                        title: `${emoji_twitch} Stalker Twitch Chatters`,
                        text:  text } );
                }
            }
        });
        
        stalkerEvents.on(`StreamChanges`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (args.platform === 'Twitch'){
                    if (!(getBooleanFromString(getGuildSetting(guild.id, 'twitch_changes')))) return false;
                    var title_emoji = emoji_twitch;
                }
                if (args.platform === 'Trovo'){
                    if (!(getBooleanFromString(getGuildSetting(guild.id, 'trovo_changes')))) return false;
                    var title_emoji = emoji_trovo;
                }
                if (args.username === 'talalusha'){
                    var channel = await getGuildChannelDB( guild, 'talala_streamchanges' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'streamchanges' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${title_emoji} Stalker ${args.platform} Changes`,
                    text:  `**${args.username}** имеет изменения:\n${args.text}` } );
                LogString(guild.name,`info`, moduleName,`${args.username} имеет изменения на ${args.platform}`);
            }
        });
        
        stalkerEvents.on(`VKProfileChanges`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'vk_profile')))) return false;
                if (args.userid === 53405222){
                    var channel = await getGuildChannelDB( guild, 'talala_vkchanges' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'vkchanges' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_vk} Stalker VK Profile`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`${args.username} имеет изменения VK`);
            }
        });

        stalkerEvents.on(`YoutubeChanges`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'youtube_newvideo')))) return false;
                if (args.channelid === 'UC0v-I8Iemr67p_MNUshCPmw'){
                    var channel = await getGuildChannelDB( guild, 'sadgod_youtube' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'youtubevideos' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_youtube} Stalker Youtube`,
                    text:  args.text,
                    image: args.image  } );
                LogString(guild.name,`info`, moduleName,`${args.username} имеет изменения на Youtube`);
            }
        });

        stalkerEvents.on(`VKFriendsChanges`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'vk_friends')))) return false;
                if (args.userid === 53405222){
                    var channel = await getGuildChannelDB( guild, 'talala_vkfriends' );
                } else {
                    var channel = await getGuildChannelDB( guild, 'vkfriends' );
                }
                await SendAnswer( {channel: channel,
                    guildname: guild.name,
                    messagetype: `info`,
                    title: `${emoji_vk} Stalker VK Friends`,
                    text:  args.text } );
                LogString(guild.name,`info`, moduleName,`${args.username} имеет изменения друзей в VK`);
            }
        });

        stalkerEvents.on(`StreamRecord`, async function (args){
            if (args.guildids && args.guildids.includes(guild.id)){
                if (!(getBooleanFromString(getGuildSetting(guild.id, 'stream_record')))) return false;
                var channel = await getGuildChannelDB( guild, 'records' );
                if (args.platform === 'twitch'){
                    var title_emoji = emoji_twitch;
                }
                if (args.platform === 'trovo'){
                    var title_emoji = emoji_trovo;
                }
                switch (args.action){
                    case 'fix':
                        await SendAnswer( {channel: channel,
                            guildname: guild.name,
                            messagetype: `info`,
                            title: `${title_emoji} Stalker Records`,
                            text:  args.text } );
                        break
                    case 'start':
                        await SendAnswer( {channel: channel,
                            guildname: guild.name,
                            messagetype: `info`,
                            title: `${title_emoji} Stalker Records`,
                            text:  `Была запущена запись **${args.name}** с платформы **${args.platform}**` } );
                        break
                    case 'stop':
                        await SendAnswer( {channel: channel,
                            guildname: guild.name,
                            messagetype: `info`,
                            title: `${title_emoji} Stalker Records`,
                            text:  `Остановлена запись **${args.name}** с платформы **${args.platform}**` } );
                        break
                    default:
                        LogString(guild.name,`info`, moduleName,`Ошибка действия`)
                }
            }
        });
    
        LogString(guild.name,`info`, moduleName,`Дей волкер, найт сталкер!`);
    },

    StalkerStartLoop: async function (){
        try{
        if (modules.stalker == true){
            if (modules_stalker.osuprofile){
                console.log('запуск осу профилей')
                await checkOsuData(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkOsuData(stalkerEvents);}, stalkerOsuScoresRefreshRate);
            }
            
            if (modules_stalker.osufollowers){
                console.log('запуск осу фоловеров')
                await checkOsuFollowers(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkOsuFollowers(stalkerEvents);}, stalkerOsuFollowersRefreshRate);
            }
            
            if (modules_stalker.youtube){
                console.log('запуск ютуба')
                await youtube.init();
                await youtube.checkYoutubeVideos(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await youtube.checkYoutubeVideos(stalkerEvents);}, stalkerYoutubeRefreshRate);
            }

            if (modules_stalker.twitchstatus){
                console.log('запуск твича')
                await checkTwitchStatus(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkTwitchStatus(stalkerEvents);}, stalkerRefreshRate);
            }
            if (modules_stalker.twitchfollowers){
                await checkUserTwitchFolowers(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkUserTwitchFolowers(stalkerEvents);}, stalkerFollowersTwitchRefreshRate);
            }
            if (modules_stalker.twitchclips){
                await checkUserTwitchClips(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkUserTwitchClips(stalkerEvents);}, stalkerClipsTwitchRefreshRate);
            }

            if (modules_stalker.trovostatus){
                await checkTrovoStatus(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkTrovoStatus(stalkerEvents);}, stalkerRefreshRate);
            }
            if (modules_stalker.trovofollowers){
                await checkTrovoFollowers(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkTrovoFollowers(stalkerEvents);}, stalkerTrovoFollowersRefreshRate);
            }
            if (modules_stalker.trovoclips){
                await checkTrovoLastClips(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkTrovoLastClips(stalkerEvents);}, stalkerClipsTrovoRefreshRate);
            }
            
            if (modules_stalker.steamstatus){
                await checkChangesSteamUser(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkChangesSteamUser(stalkerEvents);}, stalkerSteamProfilesRefreshRate);
            }

            if (modules_stalker.vkstatus){
                await checkVKstatus(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkVKstatus(stalkerEvents);}, stalkerVKProfilesRefreshRate);
            }
            if (modules_stalker.vkfriends){
                await checkVKfriends(stalkerEvents);
                setInfinityTimerLoop(async ()=>{await checkVKfriends(stalkerEvents);}, stalkerVKFollowersRefreshRate);
            }

            

        }
    }catch (e){
        console.log(e);
    }
    },
}