const { EventEmitter } = require('events');
const { getGuildChannelDB } = require('../../GuildChannel');
const { SendAnswer } = require('../../../tools/embed');
const { getGuildidsOfTrackingUserService } = require('../../DB');

this.ev = new EventEmitter();

module.exports = {
    twitchchat_load_events: (guild) => {
        
        this.ev.on('runCommand', async ({channelname, text}) => {
            const channel = await getGuildChannelDB( guild, `twitchchat_commands` );
            await SendAnswer({
                channel: channel, 
                guildname: guild.name, 
                messagetype:`chat`, 
                title: `${channelname} chat`, 
                text: `[https://www.twitch.tv/${channelname}] ${text}` });
        });
    
        this.ev.on('lastCommands', async ({text}) => {
            const channel = await getGuildChannelDB( guild, `twitchchat_commands` );
            await SendAnswer({
                channel: channel, 
                guildname: guild.name, 
                messagetype:`chat`, 
                title: `commands twitch chat`, 
                text });
        });
    
        this.ev.on('chatMention', async ({channelname, text}) => {
            const channel = await getGuildChannelDB( guild, `twitchchat_mentions` );
            await SendAnswer({
                channel: channel, 
                guildname: guild.name, 
                messagetype:`chat`, 
                title: `${channelname} chat`, 
                text: `[https://www.twitch.tv/${channelname}] ${text}` });
        });
    
        this.ev.on('newChatMessage', async ({channelname, text}) => {
           // if (channelname === ModerationName){
                const guildids = await getGuildidsOfTrackingUserService('twitchchat_tracking', channelname);
                if (guildids && guildids.includes(guild.id)){
                    const channel = await getGuildChannelDB( guild, `twitchchat_${channelname}` );
                    await SendAnswer({
                        channel: channel, 
                        guildname: guild.name, 
                        messagetype:`chat`, 
                        title: `${channelname} chat`, 
                        text: `[${channelname}] ${text}` });
                }
            //}
        });
    },

    emit: (name, args) => {
        this.ev.emit(name, args);
    }
}