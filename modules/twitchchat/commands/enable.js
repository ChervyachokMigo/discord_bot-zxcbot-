
const { log } = require("../../../tools/log.js");
const { twitchchat_enable } = require("../../DB.js");
const { ALL } = require("../constants/enumPermissions.js");

const { ModerationName } = require("../constants/general.js");

module.exports = {
    command_name: `enable`,
    command_description: ``,
    command_aliases: [`enable`, `включить`],
    command_help: `enable`,
    command_permission: ALL,
    action: async ({channelname, tags, comargs})=>{
        var username = tags.username;
        if ( tags.username === ModerationName || tags.mod === true){
            username = channelname;
        }
        console.log(tags)
        log( `[${channelname}] ${username} > enable bot functions`, `twitch chat`);
        await twitchchat_enable(username);
        return  {success: `для ${username} возобновлены функции бота`};
    }
}