require('../../settings.js');
const { TWITCHCHAT_ROUTER_PORT } = require('../../config.js');

const bodyParser = require('body-parser')

const express = require('express');

const { log } = require("../../tools/log.js");

var app = express();

const { SendAnswer } = require('../../tools/embed');
const { getGuildChannelDB } = require('../GuildChannel.js');
const { getGuildidsOfTrackingUserService } = require('../DB.js');

const init = async (discord) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.listen(TWITCHCHAT_ROUTER_PORT, ()=>{
        log(`Twitchchat router listening on http://localhost:${TWITCHCHAT_ROUTER_PORT}!`, 'Dashboard');
    });

    app.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error('Address in use, retrying...');
        }
    });

    app.post('/send', async (req, res) => {
        for (let guild_cache of discord.guilds.cache) {
            let guildid = guild_cache.shift();
            let guild = guild_cache.shift();

            let message_data = {
                ...req.body, 
                guildname: guild.name,
                messagetype: `chat`,
                title: `${req.body.channelname} chat`, 
            }

            switch (message_data.eventname){
                case 'runCommand':
                    message_data.guildchannel = `twitchchat_commands`;
                    message_data.text = `[https://www.twitch.tv/${message_data.channelname}] ${message_data.text}`;
                    break;
                case 'lastCommands':
                    message_data.guildchannel = `twitchchat_commands`;
                    break;
                case 'chatMention':
                    message_data.guildchannel = `twitchchat_mentions`;
                    message_data.text = `[https://www.twitch.tv/${message_data.channelname}] ${message_data.text}`;
                    break;
                case 'newChatMessage':
                    message_data.guildchannel = `twitchchat_${message_data.channelname}`, 
                    message_data.text = `[${message_data.channelname}] ${message_data.text}`;
                    break;
                default:
                    throw 'twitch router > incorrect eventname'+message_data.eventname
            }   


            if (message_data.eventname === 'newChatMessage' ){
                const guildids = await getGuildidsOfTrackingUserService('twitchchat_tracking', message_data.channelname);
                if (guildids && guildids.indexOf(guild.id) > -1){
                    message_data.channel = await getGuildChannelDB( guild, `twitchchat_${message_data.channelname}` );
                }
            } else {
                message_data.channel = await getGuildChannelDB( guild, message_data.guildchannel );
            }

            if (message_data.channel) {
                await SendAnswer(message_data);
            }
        }

        res.send(true);
    });

}

module.exports = {
    init
}