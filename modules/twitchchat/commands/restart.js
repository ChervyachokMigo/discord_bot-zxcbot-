const { twitchchat_refresh_category } = require("../twitchchat.js");
const { SELF } = require("../constants/enumPermissions.js");

module.exports = {
    command_name: `restart`,
    command_description: ``,
    command_aliases: [`restart`],
    command_help: `restart`,
    command_permission: SELF,
    action: async ({channelname, tags, comargs})=>{
        await twitchchat_refresh_category();
        return {error: 'restart'};
    }
}