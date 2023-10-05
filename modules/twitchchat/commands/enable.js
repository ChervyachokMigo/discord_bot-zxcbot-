
const { twitchchat_enable, twitchchat_reinit } = require("../../stalker/twitchchat.js");

module.exports = {
    command_name: `enable`,
    command_description: ``,
    command_aliases: [`enable`, `включить`],
    command_help: `enable`,
    action: async ({channelname, tags, comargs, twitchchat})=>{
        await twitchchat_enable(tags.username);
        await twitchchat_reinit();
    }
}