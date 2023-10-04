const { getTimeMSKCurrentToStringFormat } = require("../../../tools/time.js");

module.exports = {
    command_name: `test`,
    command_description: ``,
    command_aliases: [`test`],
    command_help: `test`,
    action: async ({channelname, tags, comargs, twitchchat})=>{
        await twitchchat.say( channelname, `Время московское: ${getTimeMSKCurrentToStringFormat()}` );
    }
}