const { EventEmitter } = require('events');
const tmi = require('tmi.js');
const fs = require('fs');

const { MYSQL_GET_ONE, MYSQL_GET_TRACKING_DATA_BY_ACTION,
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService, 
    MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ALL, MYSQL_SAVE, MYSQL_DELETE } = require("../DB.js");
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

var tmic ;

module.exports = {
    getChatters:getChatters,
    getUserMessagesCount:getUserMessagesCount,
    ClearChatters:ClearChatters,
    initAvailableCommands: initAvailableCommands,

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
        ev.on('newChatMessage', async ({channelname, text}) => {
           // if (channelname === 'sed_god'){
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
        const ignore_list = [
            '01ella',
            'd0nk7',
            'sed_god'
        ];

        ev.on('UserJoin', async ({channelname, username}) => {
            if (channelname === 'sed_god'){
                if ( ignore_list.includes(username) ) {
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
    log('Загрузка доступных комманд', 'Commands');
    const command_files = fs.readdirSync(`modules/twitchchat/commands`, {encoding:'utf-8'});

    AvailableCommands = [];

    for (const command_file of command_files){
        log('Загрузка команды: ' + command_file ,'Commands');
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

async function run_command({escaped_message, channelname, tags, twitchchat}) {

    if ( escaped_message.startsWith('!') ){
        const commandBody = escaped_message.slice(1).replace(/ +/g, ' ');
        var comargs = commandBody.split(' ');
        const command = comargs.shift().toLowerCase();

        for (const AvailableCommand of AvailableCommands){
            if (AvailableCommand.alias.includes(command)){
                await (require(`../twitchchat/commands/${AvailableCommand.filename}`))
                    .action({ channelname, tags, comargs, twitchchat });

                return true;
            }
        }

    } else {

        if ( escaped_message.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+\#[A-Za-z]+\/[0-9]+/gi ) !== null  ){
            const url = escaped_message.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/[0-9]+\#[A-Za-z]+\/[0-9]+/gi ).shift();
            const commandBody = escaped_message.replace(/ +/g, ' ');
            var comargs = commandBody.split(' ');
            await (require(`../twitchchat/commands/beatmap_info.js`))
                .action({ channelname, tags, url, twitchchat });
            return true;
        } else {
            if ( escaped_message.match(/https:\/\/osu\.ppy\.sh\/scores\/[A-Za-z]+\/[0-9]+/gi ) !== null  ){
                const url = escaped_message.match(/https:\/\/osu\.ppy\.sh\/scores\/[A-Za-z]+\/[0-9]+/gi ).shift();
                const commandBody = escaped_message.replace(/ +/g, ' ');
                var comargs = commandBody.split(' ');
                await (require(`../twitchchat/commands/score_info.js`))
                    .action({ channelname, tags, url, twitchchat });
                return true;
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

async function MYSQL_GET_IGNORE_TWITCH_CHATS (){
    let mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('twitchchat_ignores'));
    var usernames = [];
    if (mysql_data.length > 0){
        usernames = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'channelname');
    }
    return usernames;
}



async function twitchchat_init (discord_client){    
    log('Загрузка твич чатов', moduleName);

    initAvailableCommands();

    async function sendMessages(){
        if (MessagesBuffer.length > 0){
            for (const messages of MessagesBuffer){
                const text = messages.texts.join(`\n`);
                //log(`Новое сообщение из чата "${messages.channelname}":\n`+ text + '\n', moduleName);
                //ev.emit('newChatMessage', {channelname: messages.channelname, text});
            }
            MessagesBuffer = [];
            bufferLength = 0;
        }
    }

    setInfinityTimerLoop(sendMessages, stalkerChatRefreshRate);        

    const TwitchChatTrackingNames = await MYSQL_GET_TRACKING_TWITCH_CHATS();
    const TwitchChatLiveNames = await getTwitchSteamsByCategory({
        game_id: 21465,
        language: 'ru'
    });

    //const TwitchChatLiveNames = [];

    const TwitchChatIgnoreChannels = await MYSQL_GET_IGNORE_TWITCH_CHATS();

    const TwitchChatNames = onlyUnique([...TwitchChatTrackingNames, ...TwitchChatLiveNames])
        .filter( name => ! TwitchChatIgnoreChannels.includes(name));

    log('connect to ' + TwitchChatNames.join(', '), moduleName);

    if (TwitchChatNames.length === 0){
        log('no selected channels', moduleName)
        return false;
    }

    tmic = new tmi.Client({
        options: { debug: false },
        identity: {
            username: 'sed_god',
            password: `oauth:${twitch_chat_token}`
        },
        channels: TwitchChatNames
    });
    

    tmic.on('join', async (channelname, username) => {
        const new_channelname = channelname.replace('#', '');
        //log(`${username} подключен к чату ${new_channelname}`, moduleName);
        //ev.emit('UserJoin', {channelname: new_channelname, username});
    });

    tmic.on('message', async (channel, tags, message, self) => {
        if(self) return;

        const escaped_message = message.trim();
        const channelname = channel.toString().replace(/#/g, "");
        const username = tags.username;

        const messageFormatedText = `**${username}**: ${
            channelname === 'talalusha'? 
                boldSelectedWords(TalalaToBoldRegexp, message): 
                message}`;

        const bufferLength = MessagesBuffer.length > 0? MessagesBuffer.map( (messages) => 
            messages.texts.map( text => text.length).reduce( (a, b) => a + b) ).reduce( (a,b) => a + b ): 0;

        if ((bufferLength + messageFormatedText.length + (MessagesBuffer.length * 2)) >= 2000){//max discord message length
            await sendMessages();
        };

        const UserIndexInMessageBuffer = MessagesBuffer.findIndex( val => val.channelname === channelname );
        if (UserIndexInMessageBuffer == -1){
            MessagesBuffer.push({
                channelname: channelname, 
                texts: [messageFormatedText]
            });
        } else {
            MessagesBuffer[UserIndexInMessageBuffer].texts.push(
                messageFormatedText
            );
        }

        ChattersNewMessage(channelname, username);

        if (escaped_message.indexOf('sed_god') > -1) {
            ev.emit('newChatMessage', {channelname, text: messageFormatedText});
        }

        if ( ! await run_command({ escaped_message, channelname, tags, twitchchat: tmic }) ){
            //log(`[${channelname}] @${username}, такой команды нет.`, moduleName)
        }

    });

    await tmic.connect();
}

async function twitchchat_reinit () {
    log('Reiniting', moduleName);
    await tmic.disconnect();
    await twitchchat_init();
}

async function twitchchat_disable (channelname) {
    await MYSQL_SAVE( 'twitchchat_ignores' , {channelname}, {channelname});
}

async function twitchchat_enable (channelname) {
    await MYSQL_DELETE( 'twitchchat_ignores' , {channelname});
}