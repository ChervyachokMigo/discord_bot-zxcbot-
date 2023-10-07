const { get_twitchchat_client, twitchchat_refresh_category } = require("../../stalker/twitchchat");
const { ModerationName } = require("../constants/general");


module.exports = {
    command_name: `test`,
    command_description: ``,
    command_aliases: [`test`],
    command_help: `test`,
    action: async ({channelname, tags, comargs})=>{
        if (channelname === ModerationName && tags.username === ModerationName) {
            console.log('test ', channelname);
            if (channelname === ModerationName){
                await twitchchat_refresh_category()
            }
            return  {error: 'test'};
        }
    }
}