const { LogString } = require("../tools/log.js");
const { SendAnswer } = require("../tools/embed.js");
const { getGuildChannelDB } = require("../modules/GuildChannel.js");
const { getDiscordRelativeTime } = require('../tools/time.js');

const moduleName = 'Guild Joiner';

module.exports = {
    join: async function (member){
        var guild = member.guild;
        var user = member.user;
        var channel = await getGuildChannelDB( guild, `joiner` );
        await SendAnswer( {
            channel: channel, 
            guildname: member.guild.name, 
            messagetype:`info`, 
            title: moduleName, 
            text: `${user} присоединился!\n${getDiscordRelativeTime(new Date().valueOf())}`});
    },

    remove: async function (member){
        var guild = member.guild;
        var user = member.user;
        var time = member.joinedTimestamp;
        var channel = await getGuildChannelDB( guild, `joiner` );
        await SendAnswer( {
            channel: channel, 
            guildname: member.guild.name, 
            messagetype:`info`, 
            title: moduleName, 
            text: `${user} ушел!\n${getDiscordRelativeTime(new Date().valueOf())}`});
    }
}

