const { guildChannelShowSet } = require("../modules/GuildChannel.js");

module.exports = {
    command_name: `Channel`, 
    command_description: `Управляет типами каналов.`,
    command_aliases: [`channel`],
    command_help: `channel\nchannel type name\nchannel clear`,
    action: async (comargs, message)=>{
        await guildChannelShowSet(comargs, message, {name: module.exports.command_name,
            help: module.exports.command_help })
    }
}