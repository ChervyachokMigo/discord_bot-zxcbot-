const { log } = require("../../../tools/log");
const { get_twitch_channels_names } = require("../../DB");
const { SELF } = require("../constants/enumPermissions");

module.exports = {
    command_name: `actual_channels`,
    command_description: `Показывает список подключенных каналов`,
    command_aliases: [`channels`, `actual_channels`],
    command_help: `actual_channels`,
    command_permission: SELF,
    action: async ({channelname, tags, comargs})=>{
        const {TwitchChatNames} = await get_twitch_channels_names();
        log('[Refresh] Actual channels: ' + TwitchChatNames.join(', '), 'Twitch Chat');
        return  {error: `channels`};
    }
}