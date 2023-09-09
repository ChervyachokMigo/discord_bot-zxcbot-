const { emoji_twitch, emoji_osu, emoji_vk, emoji_trovo, emoji_steam, emoji_youtube } = require("./emojis.js");

const guild_setting_events_deps = [
    {
        event_name: 'newScore', setting_name: 'osu_scores', channel: 'osu_scoress',
        emoji: emoji_osu, message_title: 'Osu Scores'
    },
    {
        event_name: 'newOsuActivity', setting_name: 'osu_activity', channel: 'osu_octivity',
        emoji: emoji_osu, message_title: 'Osu Activites'
    },
    {
        event_name: 'osuProfileChanges', setting_name: 'osu_profiles', channel: 'osu_profiles',
        emoji: emoji_osu, message_title: 'Osu Profile Changes'
    },
    {
        event_name: 'osuFollowersChanges', setting_name: 'osu_followers', channel: 'osu_followers',
        emoji: emoji_osu, message_title: 'Osu Followers'
    },
    {
        event_name: 'steamUserProfileChanges', setting_name: 'steam_profile', channel: 'steam_profile',
        emoji: emoji_steam, message_title: 'Steam Profile Changes'
    },
    {
        event_name: 'TwitchFolowers', setting_name: 'twitch_followers', channel: 'twitch_followers',
        emoji: emoji_twitch, message_title: 'Twitch Followers'
    },
    {
        event_name: 'TrovoFolowers', setting_name: 'trovo_followers', channel: 'trovo_followers',
        emoji: emoji_trovo, message_title: 'Trovo Followers'
    },
    {
        event_name: 'newClipTwitch', setting_name: 'twitch_clips', channel: 'twitch_clips',
        emoji: emoji_twitch, message_title: 'Twitch Clips'
    },
    {
        event_name: 'newClipTrovo', setting_name: 'trovo_clips', channel: 'trovo_clips',
        emoji: emoji_trovo, message_title: 'Trovo Clips'
    },
    {
        event_name: 'ChangeTwitchStatus', setting_name: 'twitch_status', channel: 'twitch_status',
        emoji: emoji_twitch, message_title: 'Twitch Status'
    },
    {
        event_name: 'ChangeTrovoStatus', setting_name: 'trovo_status', channel: 'trovo_status',
        emoji: emoji_trovo, message_title: 'Trovo Status'
    },
    {
        event_name: 'TwitchChattersOfEndStream', setting_name: 'twitch_chatters', channel: 'twitch_chatters',
        emoji: emoji_twitch, message_title: 'Twitch Chatters'
    },
    {
        event_name: 'TwitchChanges', setting_name: 'twitch_changes', channel: 'twitch_changes',
        emoji: emoji_twitch, message_title: 'Twitch Changes'
    },
    {
        event_name: 'TrovoChanges', setting_name: 'trovo_changes', channel: 'trovo_changes',
        emoji: emoji_trovo, message_title: 'Trovo Changes'
    },
    {
        event_name: 'VKProfileChanges', setting_name: 'vk_profile', channel: 'vk_profile',
        emoji: emoji_vk, message_title: 'VK Profile Changes'
    },
    {
        event_name: 'VKFriendsChanges', setting_name: 'vk_friends', channel: 'vk_friends',
        emoji: emoji_vk, message_title: 'VK Friends Changes'
    },
    {
        event_name: 'YoutubeChanges', setting_name: 'youtube_newvideo', channel: 'youtube_newvideo',
        emoji: emoji_youtube, message_title: 'Youtube Changes'
    },
    {
        event_name: 'TwitchRecord', setting_name: 'stream_record', channel: 'twitch_records',
        emoji: emoji_twitch, message_title: 'Twitch Record'
    },
    {
        event_name: 'TrovoRecord', setting_name: 'stream_record', channel: 'trovo_records',
        emoji: emoji_twitch, message_title: 'Twitch Record'
    }
];
exports.guild_setting_events_deps = guild_setting_events_deps;
