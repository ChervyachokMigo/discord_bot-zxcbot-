const { MYSQL_GET_ENABLED_TWITCH_CHATS } = require("../../DB.js");
const { runCommand } = require('./AvailableCommands.js');
const { saveLastCommand } = require('./CommandForwarder.js');
const { getUserPermission } = require('./Permissions.js');

const allowedCommandToDisabledChannels = ['enable'];
const disallowedCommandsToEnabledChannels = []; //'enable'
const prefix = '!';

module.exports = async ({ escaped_message, channelname, tags, TwitchChatIgnoreChannels }) => {

    const TwitchChatEnabledChannels = await MYSQL_GET_ENABLED_TWITCH_CHATS();

    const is_message_starts_with_prefix = escaped_message.startsWith(prefix);

    const is_allowed_command = is_message_starts_with_prefix && allowedCommandToDisabledChannels.includes(escaped_message.slice(1));

    const is_channel_ignores = TwitchChatIgnoreChannels.indexOf(channelname) > -1;
    const is_channel_enabled = TwitchChatEnabledChannels.indexOf(channelname) > -1;
    const is_channel_disabled = !is_channel_enabled;

    const message_beatmap_link = escaped_message.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+\#[A-Za-z]+\/[0-9]+/gi);
    const message_score_link = escaped_message.match(/https:\/\/osu\.ppy\.sh\/scores\/[A-Za-z]+\/[0-9]+/gi);

    const is_message_beatmap = message_beatmap_link !== null;
    const is_message_score = message_score_link !== null;

    const username = tags.username;

    const user_permission = getUserPermission(channelname, username);

    if (is_channel_ignores && !is_allowed_command) {
        return { channelignore: `команда ${escaped_message} на игнорируемом канале ${channelname}` };
    }

    if (is_channel_disabled && !is_allowed_command) {
        return { not_enabled: `[${channelname}] ${username} > ${escaped_message}` };
    }

    if (is_message_starts_with_prefix) {

        const commandBody = escaped_message.slice(prefix.length).replace(/ +/g, ' ');
        var comargs = commandBody.split(' ');
        const command = comargs.shift().toLowerCase();

        const is_disallowed_command = disallowedCommandsToEnabledChannels.indexOf(command) > -1;

        if (is_channel_enabled && is_disallowed_command) {
            return { disallowed_command: `[${channelname}] ${username} > ${escaped_message} > спам запрещенной командой` };
        }

        saveLastCommand({ command, channelname, username });

        const result = await runCommand(command, { channelname, tags, comargs, user_permission });

        return result ? result : { not_exists_command: `[${channelname}] ${username} > ${escaped_message} > не существующая команда` };

    } else {

        if (is_message_beatmap) {

            const url = message_beatmap_link.shift();
            saveLastCommand({ command: 'request', channelname, username });
            return await runCommand('request', { channelname, tags, url, user_permission });

        } else {

            if (is_message_score) {

                const url = message_score_link.shift();
                saveLastCommand({ command: 'score', channelname, username });
                return await runCommand('score', { channelname, tags, url, user_permission });

            }

        }
    }

    return false;
};
