const { EventEmitter } = require('events');
const { ChatClient } = require("dank-twitch-irc");

const { MYSQL_GET_ALL, MYSQL_GET_ONE, MYSQL_GET_ALL_RESULTS_TO_ARRAY, 
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService } = require("../DB.js");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../modules/tools.js");
const { LogString, log } = require("../../tools/log.js");
const { setInfinityTimerLoop, SortObjectByValues } = require("../../modules/tools.js");
const { SendAnswer } = require("../../tools/embed.js");

const { getGuildChannelDB } = require (`../GuildChannel.js`);

const { emoji_twitch } = require("../../constantes/emojis.js");
const { stalkerChatRefreshRate } = require('../../settings.js');
const { modules, modules_stalker } = require('../../settings.js');


var ev = new EventEmitter();

var chatconfiguration = {};

const moduleName = `Stalker Twitch Chat`;

try{
    var client = new ChatClient(chatconfiguration);
} catch (e){
    LogString(`System`, `Error`, moduleName, e);
}

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

module.exports = {
    getChatters:getChatters,
    getUserMessagesCount:getUserMessagesCount,
    ClearChatters:ClearChatters,

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
                try{
                    client.close();
                    client = new ChatClient(chatconfiguration);
                } catch (e){
                    LogString(`System`, `Error`, moduleName, e);
                }
                module.exports.twitchchat();
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

    twitchchat: function (){    

        client.on("ready", () => LogString(`System`, `info`, moduleName,`Соединение с twitch irc установлено!`));

        client.on("close", (error) => {
            if (error != null) {
                console.error("Client closed due to error", error);
            }
        });
        client.on('error', (e)=>console.log(e));

        client.on("PRIVMSG", async (msg) => {
            var messageText = '';
            if (msg.channelName === 'talalusha'){
                messageText = boldSelectedWords(TalalaToBoldRegexp, msg.messageText);
            } else {
                messageText = msg.messageText;
            }

            var messageFormatedText = `**${msg.displayName}**: ${messageText}`;

            var bufferLength = 0;
            if (MessagesBuffer.length>0){
                for (let messagedata of MessagesBuffer){
                    for (let messagetext of messagedata.messagetext){
                        bufferLength += messagetext.length;
                    }
                }
            }

            if ((bufferLength + messageFormatedText.length + (MessagesBuffer.length * 2)) >= 2000){//max discord message length
                await sendMessages();
            };

            var UserIndexInMessageBuffer = MessagesBuffer.findIndex((val) => {
                return val.username === msg.channelName
            });
            if (UserIndexInMessageBuffer == -1){
                MessagesBuffer.push({username: msg.channelName, messagetext: [messageFormatedText]});
            } else {
                MessagesBuffer[UserIndexInMessageBuffer].messagetext.push(messageFormatedText);
            }

            ChattersNewMessage(msg.channelName, msg.displayName);
        });

        client.on("JOIN", async (msg) => {
            LogString(`System`, `info`, moduleName,`Подключен к чату - ${msg.channelName}`);
        });
    
        async function sendMessages(){
            if (MessagesBuffer.length > 0){
                for (let chatmessages of MessagesBuffer){
                    let messagestext = chatmessages.messagetext.join(`\n`);
                    console.log('chat:\n' + messagestext + '\n');
                    let TwitchChatGuildids = await getGuildidsOfTrackingUserService('twitchchat_tracking', chatmessages.username);
                    ev.emit('newChatMessage', {guildids: TwitchChatGuildids, chatname: chatmessages.username, messagetext: messagestext});
                }
                MessagesBuffer = [];
                bufferLength = 0;
            }
        }

        setInfinityTimerLoop(sendMessages, stalkerChatRefreshRate);        

        ChatsJoin();
        
        return ev;
    }
}

async function ChatsJoin(){
    await client.connect();
    var TwitchChatNames = await MYSQL_GET_TRACKING_TWITCH_CHATS();
    if (TwitchChatNames.length>0){
        await client.joinAll(TwitchChatNames);
    }
    //await client.say('tester_pivka17', '!skin');
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
    let mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('twitchchat'));
    var usernames = [];
    if (mysql_data.length > 0){
        usernames = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'username');
    }
    return usernames;
}