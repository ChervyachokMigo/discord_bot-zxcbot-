
const { Client } = require('tmi.js');


const { get_twitch_channels_names } = require("../DB.js");

const { log } = require("../../tools/log.js");

//const { getTwitchOauthToken } = require('./requests.js');
const { twitch_chat_token } = require('../../config.js');

const { ModerationName } = require('./constants/general.js');

const { initMessageForwarderTimer } = require('./tools/MessageForwarder.js');
const { initCommandsForwarderTimer, } = require('./tools/CommandForwarder.js');

const BannedChannels = require('./tools/BannedChannels.js');

const onMessage = require('./events/onMessage.js');
const { channel } = require('diagnostics_channel');

const moduleName = `Stalker Twitch Chat`;

this.twitchchat_client = null;

const twitchchat_refresh_category = async () =>{
    log('Refreshing', moduleName);

    const { TwitchChatNames } = await get_twitch_channels_names();
    const old_channels = [...this.twitchchat_client.getChannels().map( val => val.replace('#', '') )];

    const channels_to_join = TwitchChatNames.filter( val => old_channels.indexOf(val) === -1 );
    if (channels_to_join.length > 0){
        //log(`joined to `+channels_to_join.join(', '), moduleName);
        for (let channelname of channels_to_join) {
            await this.twitchchat_client.join(channelname);
        }
    }

    const channels_to_part = old_channels.filter( val => TwitchChatNames.indexOf(val) === -1 );
    if (channels_to_part.length > 0){
        //log(`leave from `+channels_to_part.join(', '), moduleName);
        for (let channelname of channels_to_part) {
            await this.twitchchat_client.part(channelname);
        }
    }
}

const twitchchat_init = async() => {    
    log('Загрузка твич чатов', moduleName);
    
    const {TwitchChatNames, TwitchChatIgnoreChannels} = await get_twitch_channels_names();

    if (TwitchChatNames.length === 0){
        log('no selected channels', moduleName)
        return;
    }

    initMessageForwarderTimer();
    initCommandsForwarderTimer();    

    this.twitchchat_client = new Client({
        options: { debug: false },
        identity: {
            username: 'sed_god',
            password: `oauth:${twitch_chat_token}`
        },
        channels: TwitchChatNames
    });

    this.twitchchat_client.on('join', async (channelname, username) => {
        const new_channelname = channelname.replace('#', '');
        if (new_channelname === ModerationName){
            if (username !== ModerationName){
                log(`[${new_channelname}] ${username} > подключен к чату`, moduleName);
                await this.twitchchat_client.say(new_channelname, `@${username}, привет` );
            }
        }
    });

    this.twitchchat_client.on('notice', async (channelname, msgid, message) => {
        log(`[notice] ${channelname} > ${msgid} > ${message}`, moduleName);
        if (msgid === 'msg_banned'){
            BannedChannels.add(channelname);
        }
    });

    this.twitchchat_client.on('message', (channel, tags, message, self) => {
        onMessage(this.twitchchat_client, channel, tags, message, self, TwitchChatIgnoreChannels)
    });

    await this.twitchchat_client.connect();
}

module.exports = {
    twitchchat_refresh_category: twitchchat_refresh_category,
    twitchchat_init: twitchchat_init,
}