const { twitchchat_reinit } = require("../../stalker/twitchchat");
const { ModerationName } = require("../constants/general");

module.exports = {
    command_name: `restart`,
    command_description: ``,
    command_aliases: [`restart`],
    command_help: `restart`,
    action: async ({channelname, tags, comargs})=>{
        if (channelname === ModerationName && tags.username === ModerationName) {
            await twitchchat_reinit();
            return {error: 'restart'};
        }
    }
}