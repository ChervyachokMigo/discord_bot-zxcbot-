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
const { checkYoutubeVideos, youtube_init } = require (`../modules/stalker/youtube.js`);

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
        if (modules.stalker == true){

            const stalker_deps = [{
                console_start_message: 'запуск осу профилей',
                is_active: modules_stalker.osuprofile,
                function_name: checkOsuData,
                refresh_time: stalkerOsuScoresRefreshRate
            },
            {
                console_start_message: 'запуск осу фоловеров',
                is_active: modules_stalker.osufollowers,
                function_name: checkOsuFollowers,
                refresh_time: stalkerOsuFollowersRefreshRate
            },
            {
                console_start_message: 'запуск ютуба',
                is_active: modules_stalker.youtube,
                function_name: checkYoutubeVideos,
                refresh_time: stalkerYoutubeRefreshRate
            },
            {
                console_start_message: 'запуск твича',
                is_active: modules_stalker.twitchstatus,
                function_name: checkTwitchStatus,
                refresh_time: stalkerRefreshRate
            },
            {
                console_start_message: 'запуск твич фоловеров',
                is_active: modules_stalker.twitchfollowers,
                function_name: checkUserTwitchFolowers,
                refresh_time: stalkerFollowersTwitchRefreshRate
            },
            {
                console_start_message: 'запуск твич клипов',
                is_active: modules_stalker.twitchclips,
                function_name: checkUserTwitchClips,
                refresh_time: stalkerClipsTwitchRefreshRate
            },
            {
                console_start_message: 'запуск трово',
                is_active: modules_stalker.trovostatus,
                function_name: checkTrovoStatus,
                refresh_time: stalkerRefreshRate
            },
            {
                console_start_message: 'запуск трово фоловеров',
                is_active: modules_stalker.trovofollowers,
                function_name: checkTrovoFollowers,
                refresh_time: stalkerTrovoFollowersRefreshRate
            },
            {
                console_start_message: 'запуск трово клипов',
                is_active: modules_stalker.trovoclips,
                function_name: checkTrovoLastClips,
                refresh_time: stalkerClipsTrovoRefreshRate
            },
            {
                console_start_message: 'запуск стим',
                is_active: modules_stalker.steamstatus,
                function_name: checkChangesSteamUser,
                refresh_time: stalkerSteamProfilesRefreshRate
            },
            {
                console_start_message: 'запуск vk',
                is_active: modules_stalker.vkstatus,
                function_name: checkVKstatus,
                refresh_time: stalkerVKProfilesRefreshRate
            },
            {
                console_start_message: 'запуск вк друзей',
                is_active: modules_stalker.vkfriends,
                function_name: checkVKfriends,
                refresh_time: stalkerVKFollowersRefreshRate
            }
        ];

            for (const stalker_module of stalker_deps){
                await initStalkerModule(stalker_module.is_active, stalker_module.function_name, stalker_module.refresh_time, stalker_module.console_start_message);
            }

        }
    }
}

async function initStalkerModule(is_active, check_function , refresh_time, console_message){
    if (is_active){
        log(console_message, moduleName);
        if (check_function == checkYoutubeVideos){
            await youtube_init();
        }
        await check_function(stalkerEvents);
        setInfinityTimerLoop(async ()=>{await check_function(stalkerEvents);}, refresh_time);
    }
}