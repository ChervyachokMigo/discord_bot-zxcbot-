const { EventEmitter } = require('events');
const tmi = require('tmi.js');
const fs = require('fs');

const { MYSQL_GET_ONE, MYSQL_GET_TRACKING_DATA_BY_ACTION,
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService, 
    MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ALL, MYSQL_SAVE, MYSQL_DELETE, MYSQL_GET_IGNORE_TWITCH_CHATS, MYSQL_GET_ENABLED_TWITCH_CHATS } = require("../DB.js");
const { GET_VALUES_FROM_OBJECT_BY_KEY, onlyUnique } = require("../../modules/tools.js");
const { log } = require("../../tools/log.js");
const { setInfinityTimerLoop, SortObjectByValues } = require("../../modules/tools.js");
const { SendAnswer } = require("../../tools/embed.js");

const { getGuildChannelDB } = require (`../GuildChannel.js`);

const { emoji_twitch } = require("../../constantes/emojis.js");
const { stalkerChatRefreshRate } = require('../../settings.js');
const { modules, modules_stalker } = require('../../settings.js');

//const { getTwitchOauthToken } = require('./requests.js');
const { twitch_chat_token } = require('../../config.js');
const { getTwitchSteamsByCategory } = require('./requests.js');
const { ModerationName } = require('../twitchchat/constants/general.js');

var ev = new EventEmitter();

const moduleName = `Stalker Twitch Chat`;

const TalalaToBoldRegexp = /[тТ]ал((ыч|ый|ому)|[аы]л(а|уш)?)(.*|а|е|у)?|talal(a|usha|.*)?|[иИ]гнат(ий|ию|у|е|.*)?|[Аа]ртем(.*|у|е|ы|а)?|[Аа]н(д)?жел(.*|у|е|ы|а)?|[Aa]ngel(.*)?|[Tt]alov(.*)?|[Тт]алов(.*)?/gi;

var MessagesBuffer = [];

var Chatters = [];

function ClearChatters(channel){
    Chatters[channel] = {};
    Chatters[channel].TotalMessages = 0;
    Chatters[channel].Users = {};
}

function ChattersNewMessage(channel, username){
    if (typeof Chatters[channel] ==='undefined'){
        Chatters[channel] = {};
    }
    if (typeof Chatters[channel].TotalMessages ==='undefined'){
        Chatters[channel].TotalMessages = 0;
    }
    if (typeof Chatters[channel].Users ==='undefined'){
        Chatters[channel].Users = {};
    }
    if(typeof Chatters[channel].Users[username] === 'undefined'){
        Chatters[channel].Users[username] = 0;
    }
    Chatters[channel].Users[username]++;
    Chatters[channel].TotalMessages++;
}

function getChatters(channel){
    if (typeof Chatters[channel] ==='undefined'){
        Chatters[channel] = {};
    }
    if (typeof Chatters[channel].TotalMessages ==='undefined'){
        Chatters[channel].TotalMessages = 0;
    }
    if (typeof Chatters[channel].Users ==='undefined'){
        Chatters[channel].Users = {};
    } else {
        Chatters[channel].Users = SortObjectByValues(Chatters[channel].Users, false);
    }
    return Chatters[channel];
}

function getUserMessagesCount(channel, username){
    if (typeof Chatters[channel] ==='undefined'){
        Chatters[channel] = {};
    }
    if (typeof Chatters[channel].TotalMessages ==='undefined'){
        Chatters[channel].TotalMessages = 0;
    }
    if (typeof Chatters[channel].Users ==='undefined'){
        Chatters[channel].Users = {};
    }
    if(typeof Chatters[channel].Users[username] === 'undefined'){
        Chatters[channel].Users[username] = 0;
    }
    return Chatters[channel][username];
}

this.twitchchat_client = null;

const set_new_twitchchat_client = (client) => {
    this.twitchchat_client = client;
}

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
    for (let channelname of channels_to_join) {
        console.log('joined to',
            await this.twitchchat_client.join(channelname)
        );
    }

    const channels_to_part = old_channels.filter( val => TwitchChatNames.indexOf(val) === -1 );
    for (let channelname of channels_to_part) {
        console.log('part from',
            await this.twitchchat_client.part(channelname)
        );
    }
}

const get_twitchchat_client = () => {
    return this.twitchchat_client;
}

module.exports = {
    twitchchat_refresh_category: twitchchat_refresh_category,
    getChatters: getChatters,
    getUserMessagesCount: getUserMessagesCount,
    ClearChatters: ClearChatters,
    initAvailableCommands: initAvailableCommands,
    set_new_twitchchat_client: set_new_twitchchat_client,
    get_twitchchat_client: get_twitchchat_client,
    get_twitch_channels_names: get_twitch_channels_names,

    MYSQL_TWITCH_CHAT_TRACKING_CHANGE: async function(message, username, option){
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('twitchchat', {username: username});
        if (userdata === null ) {
            userdata = {
                username: username,
                tracking: true
            }
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'twitchchat', 'tracking', option.value, ['username', userdata.username], 'twitchchat');
                break;
            default:
                throw new Error('unexpected error: undefined action');
        }

        if (modules.stalker){  
            if (modules_stalker.twitchchat){  
                //need restart
            }
        }

        return {success: true, text: `Twitch chat for user **${username}** set **${option.action}** is **${option.value}**`}
    },
    
    TWITCHCHAT_TRACKING_INFO: async function (message){
        var mysql_data = await getTrackingUsersForGuild(message.guild.id, 'twitchchat_tracking', 'twitchchat');
        console.log('TWITCHCHAT_TRACKING_INFO','guild',message.guild.id,'data', mysql_data)
        if (mysql_data.length > 0){
            let MessageFields = [];
            var usernamesFields = '';
            var channelids = '';
            var channelurls = '';
            for (let userdata of mysql_data){
                let username = userdata.username.toString();
                let channelname = `twitchchat_${username}`;
                let chatchannel = await getGuildChannelDB(message.guild, channelname);
                usernamesFields += `${username}\n`;
                channelids += `<#${chatchannel.id}>\n`;
                channelurls += `[ссылка](https://www.twitch.tv/popout/${username}/chat)\n`;
            }
            MessageFields.push ({name: 'Username', value: usernamesFields, inline: true});
            MessageFields.push ({name: 'Channel', value: channelids, inline: true});
            MessageFields.push ({name: 'Link', value: channelurls, inline: true});
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_twitch} ${moduleName}`,
                text: `Tracking users info`,
                fields: MessageFields} );
        } else {
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_twitch} ${moduleName}`,
                text: `No tracking users`});
        }
    },

    twitchchat_reinit: twitchchat_reinit,

    twitchchat_init: twitchchat_init,

    twitchchat_load_events: (guild) => {
        
        ev.on('runCommand', async ({channelname, text}) => {
            const channel = await getGuildChannelDB( guild, `twitchchat_commands` );
            await SendAnswer({
                channel: channel, 
                guildname: guild.name, 
                messagetype:`chat`, 
                title: `${channelname} chat`, 
                text: `[https://www.twitch.tv/${channelname}] ${text}` });
        });

        ev.on('lastCommands', async ({text}) => {
            const channel = await getGuildChannelDB( guild, `twitchchat_commands` );
            await SendAnswer({
                channel: channel, 
                guildname: guild.name, 
                messagetype:`chat`, 
                title: `commands twitch chat`, 
                text });
        });

        ev.on('chatMention', async ({channelname, text}) => {
            const channel = await getGuildChannelDB( guild, `twitchchat_mentions` );
            await SendAnswer({
                channel: channel, 
                guildname: guild.name, 
                messagetype:`chat`, 
                title: `${channelname} chat`, 
                text: `[https://www.twitch.tv/${channelname}] ${text}` });
        });

        ev.on('newChatMessage', async ({channelname, text}) => {
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

        const ignore_join_list = [
            ModerationName
        ];

        ev.on('UserJoin', async ({channelname, username}) => {
            if (channelname === ModerationName){
                if ( ignore_join_list.includes(username) ) {
                    return;
                } 
                const guildids = await getGuildidsOfTrackingUserService('twitchchat_tracking', channelname);
                if (guildids && guildids.includes(guild.id)){
                    const channel = await getGuildChannelDB( guild, `twitchchat_${channelname}` );
                    await SendAnswer({
                        channel: channel, 
                        guildname: guild.name, 
                        messagetype:`chat`, 
                        title: `${channelname} chat`, 
                        text: `**${username}** присоединился к чату` });
                }
            }
        });

    },

    twitchchat_disable: twitchchat_disable,
    twitchchat_enable: twitchchat_enable,
}

var AvailableCommands = [];

function initAvailableCommands (){
    log('Загрузка доступных комманд', 'Twitch Commands');
    const command_files = fs.readdirSync(`modules/twitchchat/commands`, {encoding:'utf-8'});

    AvailableCommands = [];

    for (const command_file of command_files){
        log('Загрузка команды: ' + command_file ,'Twitch Commands');
        let { command_aliases, command_description, command_name, command_help } = require(`../twitchchat/commands/${command_file}`);
        AvailableCommands.push({
            filename: command_file,
            name: command_name,
            desc: command_description,
            alias: command_aliases,
            help: command_help
        });
    }
}

function getAvailableCommands(){
    return AvailableCommands;
}

let LastCommands = [];

const allowedCommandToIngoredChannels = ['enable', 'test'];

const disallowedCommandsToEnabledChannels = ['enable'];

async function run_command({ escaped_message, channelname, tags, TwitchChatIgnoreChannels}) {
    
    const TwitchChatEnabledChannels = await MYSQL_GET_ENABLED_TWITCH_CHATS();

    const is_allowed_command = escaped_message.startsWith('!') && allowedCommandToIngoredChannels.includes(escaped_message.slice(1));
    const is_channel_ignores = TwitchChatIgnoreChannels.indexOf( channelname) > -1;
    const is_channel_enabled = TwitchChatEnabledChannels.indexOf (channelname) > -1;
    const is_channel_disabled = ! is_channel_enabled;

    const message_beatmap_link =  escaped_message.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+\#[A-Za-z]+\/[0-9]+/gi );
    const message_score_link = escaped_message.match(/https:\/\/osu\.ppy\.sh\/scores\/[A-Za-z]+\/[0-9]+/gi );

    const is_message_beatmap = message_beatmap_link !== null;
    const is_message_score = message_score_link !== null;

    if (is_channel_ignores && ! is_allowed_command ) {
        return {channelignore: `команда ${escaped_message} на игнорируемом канале ${channelname}`};
    }

    if ( is_channel_disabled && ! is_allowed_command) {
        return {not_enabled: `[${channelname} (канал не добавлен в бота)] ${tags.username} > ${escaped_message}`};
    }

    if ( escaped_message.startsWith('!') ){

        const commandBody = escaped_message.slice(1).replace(/ +/g, ' ');
        var comargs = commandBody.split(' ');
        const command = comargs.shift().toLowerCase();

        const is_disallowed_command = disallowedCommandsToEnabledChannels.indexOf(command) > -1;

        if ( is_channel_enabled && is_disallowed_command ){
            return {disallowed_command: `[${channelname}] ${tags.username} > ${escaped_message} > спам запрещенной командой`};
        }

        for (const AvailableCommand of AvailableCommands){
            if (AvailableCommand.alias.includes(command)){
                LastCommands.push({command, channelname, username: tags.username});
                return await (require(`../twitchchat/commands/${AvailableCommand.filename}`))
                    .action({ channelname, tags, comargs });
            }
        }

        return {not_exists_command: `[${channelname}] ${tags.username} > ${escaped_message} > не существующая команда`}

    } else {

        if ( is_message_beatmap  ){
            LastCommands.push({command: 'request', channelname, username: tags.username});
            const url = message_beatmap_link.shift();
            const commandBody = escaped_message.replace(/ +/g, ' ');
            var comargs = commandBody.split(' ');
            return await (require(`../twitchchat/commands/beatmap_info.js`))
                .action({ channelname, tags, url });

        } else {

            if ( is_message_score  ){
                LastCommands.push({command: 'score', channelname, username: tags.username});
                const url = message_score_link.shift();
                const commandBody = escaped_message.replace(/ +/g, ' ');
                var comargs = commandBody.split(' ');
                return await (require(`../twitchchat/commands/score_info.js`))
                    .action({ channelname, tags, url });

            }

        }
    }

    return false;
}

function boldSelectedWords(regexp, str){
    let messages = str.split(' ');
    messages.map((val,idx,arr)=>{
        if (!val.startsWith('http')){
            arr[idx] = val.replace(regexp,(val)=>{return `**${val}**`});
        }
    }) 
    messages = messages.join(' ');
    return messages;
}

async function MYSQL_GET_TRACKING_TWITCH_CHATS (){
    let mysql_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('twitchchat', {tracking: true});
    var usernames = [];
    if (mysql_data.length > 0){
        usernames = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'username');
    }
    return usernames;
}

function formatCommandText({channelname, username, command}){
    return `[https://www.twitch.tv/${channelname}] ${username} > ${command}`;
}

function getCommandsTextLength () {
    if (LastCommands.length > 0){
        return LastCommands.map( val => formatCommandText(val)).join(`\n`).length;
    } else {
        return 0;
    }
}

async function sendLastCommands(){

    if (LastCommands.length > 0){
        const text = LastCommands.map( val => formatCommandText(val)).join(`\n`);
        ev.emit('lastCommands', {text});
        LastCommands = [];
    }
}

async function sendMessages(){
    if (MessagesBuffer.length > 0){
        for (const messages of MessagesBuffer){
            
            if (messages.channelname === ModerationName){
                const text = messages.texts.join(`\n`);
                ev.emit('newChatMessage', {channelname: messages.channelname, text});
            }

        }
        MessagesBuffer = [];
        bufferLength = 0;
    }
}

var send_message_timer = null;
var send_lastcommands_timer = null;

async function get_twitch_channels_names(){
    const TwitchChatTrackingNames = await MYSQL_GET_TRACKING_TWITCH_CHATS();
    const TwitchChatLiveNames = await getTwitchSteamsByCategory({
        game_id: 21465,
        language: 'ru'
    });

    const TwitchChatIgnoreChannels = await MYSQL_GET_IGNORE_TWITCH_CHATS();
    const TwitchChatNames = onlyUnique([...TwitchChatTrackingNames, ...TwitchChatLiveNames]);

    return { TwitchChatNames, TwitchChatIgnoreChannels };
}

function add_message_to_buffer (channelname, message_formated){
    //channel index in buffer
    const i = MessagesBuffer.findIndex( val => val.channelname === channelname );

    //is not exists
    if (i == -1){
        MessagesBuffer.push({
            channelname: channelname, 
            texts: [message_formated]
        });
    } else {
        MessagesBuffer[i].texts.push(
            message_formated
        );
    }
}

async function twitchchat_init (){    
    log('Загрузка твич чатов', moduleName);

    if (send_message_timer) {
        clearInterval(send_message_timer);
    }

    if (send_lastcommands_timer) {
        clearInterval(send_lastcommands_timer);
    }

    send_message_timer = setInfinityTimerLoop(sendMessages, stalkerChatRefreshRate);     
    send_lastcommands_timer = setInfinityTimerLoop(sendLastCommands, stalkerChatRefreshRate);     
    
    const {TwitchChatNames, TwitchChatIgnoreChannels} = await get_twitch_channels_names();

    if (TwitchChatNames.length === 0){
        log('no selected channels', moduleName)
        return false;
    }

    let tmic = new tmi.Client({
        options: { debug: false },
        identity: {
            username: 'sed_god',
            password: `oauth:${twitch_chat_token}`
        },
        channels: TwitchChatNames
    });

    tmic.on('join', async (channelname, username) => {
        const new_channelname = channelname.replace('#', '');
        if (new_channelname === ModerationName){
            log(`${username} подключен к чату ${new_channelname}`, moduleName);
             //ev.emit('UserJoin', {channelname: new_channelname, username});
        }
    });

    tmic.on('message', async (channel, tags, message, self) => {

        if(self) return;

        const escaped_message = message.trim();
        const channelname = channel.toString().replace(/#/g, "");
        const username = tags.username;

        const messageFormatedText = `**${username}**: ${message}`;
        /*${
            channelname === 'talalusha'? 
                boldSelectedWords(TalalaToBoldRegexp, message): 
                message}`;*/

        const bufferLength = MessagesBuffer.length > 0? MessagesBuffer.map( (messages) => 
            messages.texts.map( text => text.length).reduce( (a, b) => a + b) ).reduce( (a,b) => a + b ): 0;

        if ((bufferLength + messageFormatedText.length + (MessagesBuffer.length * 2)) >= 2000){//max discord message length
            await sendMessages();
        };

        add_message_to_buffer(channelname, messageFormatedText)

        if (channelname === ModerationName){
            ChattersNewMessage(channelname, username);
        }

        if (escaped_message.indexOf(ModerationName) > -1) {
            ev.emit('chatMention', {channelname, text: messageFormatedText});
        }

        const command_response = await run_command({ escaped_message, channelname, tags, TwitchChatIgnoreChannels });

        if ( command_response.success ){
            tmic.say (channel, command_response.success );
            ev.emit('runCommand', {channelname, text: messageFormatedText});
            console.log(`[${channelname}] ${tags.username} >  ${messageFormatedText} `);
        } else if (command_response.error) {
            console.log(command_response.error);
        } else if (command_response.channelignore) {
            console.log(command_response.channelignore);
        } else if ( command_response.not_enabled) {
            //console.log(command_response.not_enabled) //чатики
        } else if ( command_response.disallowed_command){
            console.log(command_response.disallowed_command)
        } else if ( command_response.not_exists_command) {
            console.log(command_response.not_exists_command)
        } else {
            console.error('twitchchat: не существующая команда или не команда');
        }   

    });

    await tmic.connect();

    set_new_twitchchat_client(tmic);

}

async function twitchchat_disable (channelname) {
    //await MYSQL_SAVE( 'twitchchat_ignores' , {channelname}, {channelname});
    await MYSQL_DELETE( 'twitchchat_enabled' , {channelname});
}

async function twitchchat_enable (channelname) {
    await MYSQL_DELETE( 'twitchchat_ignores' , {channelname});
    await MYSQL_SAVE( 'twitchchat_enabled' , {channelname}, {channelname});
}

const notify_message = `Привет, если нужен бот для того, чтобы карты из чата отправлялись в игру и писались её параметры, то напиши !enable в чате (это автоматическое сообщние, и повторяться не будет)`