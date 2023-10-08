
const { Client } = require('tmi.js');


const {  MYSQL_GET_ENABLED_TWITCH_CHATS, get_twitch_channels_names} = require("../DB.js");

const { log } = require("../../tools/log.js");

//const { getTwitchOauthToken } = require('./requests.js');
const { twitch_chat_token } = require('../../config.js');

const { ModerationName } = require('./constants/general.js');
const { addMessageAmount } = require('./tools/ChattersAmounts.js');
const { emit } = require('./tools/GuildEvents.js');
const { runCommand } = require('./tools/AvailableCommands.js');
const { saveMessageInBuffer, sendIfLongLength, initMessageForwarderTimer } = require('./tools/MessageForwarder.js');
const { initCommandsForwarderTimer, saveLastCommand } = require('./tools/CommandForwarder.js');

const BannedChannels = require('./tools/BannedChannels.js');

const { getUserPermission } = require('./tools/Permissions.js');

const moduleName = `Stalker Twitch Chat`;

this.twitchchat_client = null;

const twitchchat_reinit = async () => {
    log('Reiniting', moduleName);
    await this.twitchchat_client.disconnect();
    await twitchchat_init();
}

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

const allowedCommandToIngoredChannels = ['enable', 'test'];

const disallowedCommandsToEnabledChannels = ['enable'];

const manageMessage = async ({ escaped_message, channelname, tags, TwitchChatIgnoreChannels}) => {
    
    const TwitchChatEnabledChannels = await MYSQL_GET_ENABLED_TWITCH_CHATS();

    const prefix = '!';
    const is_message_starts_with_prefix = escaped_message.startsWith(prefix);

    const is_allowed_command = is_message_starts_with_prefix && allowedCommandToIngoredChannels.includes(escaped_message.slice(1));

    const is_channel_ignores = TwitchChatIgnoreChannels.indexOf( channelname) > -1;
    const is_channel_enabled = TwitchChatEnabledChannels.indexOf (channelname) > -1;
    const is_channel_disabled = ! is_channel_enabled;

    const message_beatmap_link = escaped_message.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+\#[A-Za-z]+\/[0-9]+/gi );
    const message_score_link = escaped_message.match(/https:\/\/osu\.ppy\.sh\/scores\/[A-Za-z]+\/[0-9]+/gi );

    const is_message_beatmap = message_beatmap_link !== null;
    const is_message_score = message_score_link !== null;

    const username = tags.username;

    const user_permission = getUserPermission(channelname, username);

    if (is_channel_ignores && ! is_allowed_command ) {
        return {channelignore: `команда ${escaped_message} на игнорируемом канале ${channelname}`};
    }

    if ( is_channel_disabled && ! is_allowed_command) {
        return {not_enabled: `[${channelname}] ${username} > ${escaped_message}`};
    }

    if ( is_message_starts_with_prefix ){

        const commandBody = escaped_message.slice(prefix.length).replace(/ +/g, ' ');
        var comargs = commandBody.split(' ');
        const command = comargs.shift().toLowerCase();

        const is_disallowed_command = disallowedCommandsToEnabledChannels.indexOf(command) > -1;

        if ( is_channel_enabled && is_disallowed_command ){
            return {disallowed_command: `[${channelname}] ${username} > ${escaped_message} > спам запрещенной командой`};
        }

        saveLastCommand({command, channelname, username});

        const result = await runCommand(command, { channelname, tags, comargs, user_permission });

        return result? result: {not_exists_command: `[${channelname}] ${username} > ${escaped_message} > не существующая команда`}

    } else {

        if ( is_message_beatmap  ){
            
            const url = message_beatmap_link.shift();
            saveLastCommand({command: 'request', channelname, username});
            return await runCommand('request', { channelname, tags, url, user_permission });

        } else {

            if ( is_message_score  ){
                
                const url = message_score_link.shift();
                saveLastCommand({command: 'score', channelname, username});
                return await runCommand('score', { channelname, tags, url, user_permission });

            }

        }
    }

    return false;
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



    this.twitchchat_client.on('message', async (channel, tags, message, self) => {

        if(self) return;

        const escaped_message = message.trim();
        const channelname = channel.toString().replace(/#/g, "");
        const username = tags.username;

        const messageFormatedText = `**${username}**: ${message}`;
        /*${
            channelname === 'talalusha'? 
                boldSelectedWords(TalalaToBoldRegexp, message): 
                message}`;*/

        sendIfLongLength(messageFormatedText);

        saveMessageInBuffer(channelname, messageFormatedText);

        if (channelname === ModerationName){
            addMessageAmount(channelname, username);
        }

        if (escaped_message.indexOf(ModerationName) > -1) {
            emit('chatMention', {channelname, text: messageFormatedText});
        }

        const command_response = await manageMessage({ escaped_message, channelname, tags, TwitchChatIgnoreChannels });

        if ( command_response.success ){
            await this.twitchchat_client.say (channel, command_response.success );
            emit('runCommand', {channelname, text: messageFormatedText});
            log(`[${channelname}] ${tags.username} >  ${messageFormatedText} `, moduleName);
        } else if (command_response.error) {
            console.error(command_response.error);
        } else if (command_response.channelignore) {
            //console.log(`[ignoring] ${command_response.channelignore}`); //чатики
        } else if ( command_response.not_enabled) {
            //console.log(`[disabled] ${command_response.not_enabled}`) //чатики
        } else if ( command_response.disallowed_command){
            console.log(command_response.disallowed_command)
        } else if ( command_response.not_exists_command) {
            console.log(command_response.not_exists_command)
        } else if ( command_response.permission) {
            console.log(`[${channelname}] ${username} > ${command_response.permission}`)
        } else {
            //console.error('twitchchat: не существующая команда или не команда'); //чатик enabled
        }   

    });

    await this.twitchchat_client.connect();
}

module.exports = {
    twitchchat_refresh_category: twitchchat_refresh_category,
    twitchchat_init: twitchchat_init,
    twitchchat_reinit: twitchchat_reinit,
}