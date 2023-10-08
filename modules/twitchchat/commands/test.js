const { twitchchat_refresh_category } = require("../twitchchat.js");
const { SELF } = require("../constants/enumPermissions.js");

module.exports = {
    command_name: `test`,
    command_description: ``,
    command_aliases: [`test`],
    command_help: `test`,
    command_permission: SELF,
    action: async ({channelname, tags, comargs})=>{
        console.log('test ', channelname);
        await twitchchat_refresh_category()
        return  {error: 'test'};
    }
}