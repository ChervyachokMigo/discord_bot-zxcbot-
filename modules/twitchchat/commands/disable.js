
const { twitchchat_disable, twitchchat_reinit } = require("../../stalker/twitchchat.js");

module.exports = {
    command_name: `disable`,
    command_description: ``,
    command_aliases: [`disable`, `отключить`],
    command_help: `disable`,
    action: async ({channelname, tags, comargs, twitchchat})=>{
        await twitchchat_disable(tags.username);
        await twitchchat_reinit();
    }
}