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

//инициализация каналов дял новой гильдии

var {EventEmitter} = require('events');

var { getDiscordRelativeTime } = require('../tools/time.js');
const { getGuildChannelDB } = require (`../modules/GuildChannel.js`);
const { SendAnswer } = require("../tools/embed.js");
const { log } = require("../tools/log.js");
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

const guild_setting_deps = [
    {event_name: 'newScore', setting_name: 'osu_scores', channel: 'newscores', 
        emoji: emoji_osu, message_title: 'Osu Scores'},
    {event_name: 'newOsuActivity', setting_name: 'osu_activity', channel: 'newactivityies', 
        emoji: emoji_osu, message_title: 'Osu Activites'},
    {event_name: 'osuProfileChanges', setting_name: 'osu_profiles', channel: 'osuchanges',
        emoji: emoji_osu, message_title: 'Osu Profile Changes'},
    {event_name: 'osuFollowersChanges', setting_name: 'osu_followers', channel: 'osufollowers',
        emoji: emoji_osu, message_title: 'Osu Followers'},
    {event_name: 'steamUserProfileChanges', setting_name: 'steam_profile', channel: 'steamchanges',
        emoji: emoji_steam, message_title: 'Steam Profile Changes'},
    {event_name: 'TwitchFolowers', setting_name: 'twitch_followers', channel: 'streamfollowers',
        emoji: emoji_twitch, message_title: 'Twitch Followers'},
    {event_name: 'TrovoFolowers', setting_name: 'trovo_followers', channel: 'streamfollowers',
        emoji: emoji_trovo, message_title: 'Trovo Followers'},
    {event_name: 'newClipTwitch', setting_name: 'twitch_clips', channel: 'twitchclips',
        emoji: emoji_twitch, message_title: 'Twitch Clips'},
    {event_name: 'newClipTrovo', setting_name: 'trovo_clips', channel: 'trovoclips',
        emoji: emoji_trovo, message_title: 'Trovo Clips'},
    {event_name: 'ChangeTwitchStatus', setting_name: 'twitch_status', channel: 'streamstatus',
        emoji: emoji_twitch, message_title: 'Twitch Status'},
    {event_name: 'ChangeTrovoStatus', setting_name: 'trovo_status', channel: 'streamstatus',
        emoji: emoji_trovo, message_title: 'Trovo Status'},
    {event_name: 'TwitchChattersOfEndStream', setting_name: 'twitch_chatters', channel: 'streamstatus',
        emoji: emoji_twitch, message_title: 'Twitch Chatters'},
    {event_name: 'TwitchChanges', setting_name: 'twitch_changes', channel: 'streamchanges',
        emoji: emoji_twitch, message_title: 'Twitch Changes'},
    {event_name: 'TrovoChanges', setting_name: 'trovo_changes', channel: 'streamchanges',
        emoji: emoji_trovo, message_title: 'Trovo Changes'},
    {event_name: 'VKProfileChanges', setting_name: 'vk_profile', channel: 'vkchanges',
        emoji: emoji_vk, message_title: 'VK Profile Changes'},
    {event_name: 'VKFriendsChanges', setting_name: 'vk_friends', channel: 'vkfriends',
        emoji: emoji_vk, message_title: 'VK Friends Changes'},
    {event_name: 'YoutubeChanges', setting_name: 'youtube_newvideo', channel: 'youtubevideos',
        emoji: emoji_youtube, message_title: 'Youtube Changes'},
    {event_name: 'TwitchRecord', setting_name: 'stream_record', channel: 'records',
        emoji: emoji_twitch, message_title: 'Twitch Record'},
    {event_name: 'TrovoRecord', setting_name: 'stream_record', channel: 'records',
        emoji: emoji_twitch, message_title: 'Twitch Record'}
];

module.exports = {
    StalkerStartListeners: async function (guild){

        function ListenEvent(event_name) {

            stalkerEvents.on(event_name, async function (args){

                if (args.guildids && args.guildids.includes(guild.id)){
                    
                    const setting_deps = guild_setting_deps.find(val=> val.event_name === event_name);

                    if (!(getBooleanFromString(getGuildSetting(guild.id, setting_deps.setting_name)))) {
                        return false;
                    }

                    const channel = await getGuildChannelDB(guild, setting_deps.channel);
                    
                    var message_text = '';
                    var message_image = '';

                    switch (event_name){
                        case 'newScore':
                        case 'newOsuActivity':
                        case 'osuFollowersChanges':
                        case 'steamUserProfileChanges':
                        case 'ChangeTwitchStatus':
                        case 'ChangeTrovoStatus':
                        case 'VKProfileChanges':
                        case 'VKFriendsChanges':
                            message_text = args.text;
                            break;
                        case 'osuProfileChanges':
                        case 'YoutubeChanges':
                            message_text = args.text;
                            message_image = args.image
                            break;
                        case 'TwitchFolowers':
                            message_text = `На канале **[${args.username}](https://www.twitch.tv/${args.username})** изменилось количество подписчиков на **${args.diff}**\nТеперь подписано **${args.count}** человек`;
                        case 'TrovoFolowers':
                            message_text = `На канале **[${args.username}](https://trovo.live/s/${args.username})** изменилось количество подписчиков на **${args.diff}**\nТеперь подписано **${args.count}** человек`;
                            break;
                        case 'newClipTwitch':
                        case 'newClipTrovo':
                            message_text = `На канале **${args.broadcaster_name || args.streamer_username}** появился [новый клип](${args.url})\n`;
                            message_text += `Название: **${args.title}**\n`;
                            message_text += `Создатель: **${args.creator_name || args.maker_username}**\n`;
                            message_text += `Дата: ${args.created_at?getDiscordRelativeTime( args.created_at ):'' ||
                                args.made_at?getDiscordRelativeTime( args.made_at*1000 ):''}\n`;
                            break;
                        case 'TwitchChattersOfEndStream':
                            message_text = `Total Messages: **${args.chatters.TotalMessages}**\nTotal Users: **${Object.entries(args.chatters.Users).length}**\n${ObjToString(args.chatters.Users)}`;
                            break;
                        case 'TwitchChanges':
                        case 'TrovoChanges':
                            message_text = `**${args.username}** имеет изменения:\n${args.text}`;
                            break;
                        case 'TwitchRecord':
                        case 'TrovoRecord':
                            switch (args.action){
                                case 'fix':
                                    message_text = args.text
                                    break;
                                case 'start':
                                    message_text = `Была запущена запись **${args.name}** с платформы **${args.platform}**`;
                                    break;
                                case 'stop':
                                    message_text = `Остановлена запись **${args.name}** с платформы **${args.platform}**`;
                                    break;
                                default:
                                    log('Ошибка действия', moduleName + ' ' + setting_deps.message_title);
                            }
                            break;
                        default:
                            message_text = 'null text';
                    }

                    log('new event: ' + setting_deps.message_title, moduleName);

                    await SendAnswer({ channel,
                        guildname: guild.name,
                        messagetype: `info`,
                        title: `${setting_deps.emoji} ${setting_deps.message_title}`,
                        text: message_text,
                        image: message_image 
                    });

                }
            });
        }

        guild_setting_deps.forEach( stalker_event => {
            console.log('Запуск слушателя события:', stalker_event.event_name)
            ListenEvent(stalker_event.event_name);
        });

        log (`Дей волкер, найт сталкер!`, moduleName);
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
            }];

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