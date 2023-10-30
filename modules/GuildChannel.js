
const { MYSQL_SAVE,  MYSQL_GET_ALL, MYSQL_DELETE } = require("./DB/base.js");

const { LogString } = require("../tools/log.js")

const { SendAnswer, SendError } = require("../tools/embed.js")

const { AllowedNamesOfGuildChannels, AllowedChannelsStartedWith } = require("../settings.js")

module.exports = {

    fetchGuildChannel: async function (guild, channelid){
        try {
            var botChannel = await guild.channels.fetch(channelid)
        } catch (ChannelError){} //if (ChannelError.code === 10003) {}

        if (botChannel) 
            return botChannel
        else 
            return false
    },

    getGuildChannelDB: async function ( guild , channeltype ){
        if (!channeltype) throw new Error ('wrong channel type: ' + channeltype)

        const BotChannelsDB = await MYSQL_GET_ALL(`botchannel`, { guildid: guild.id } );

        var botchannel = false;
        var channelSet = false;
        var channelSystem = false;
        
        if (BotChannelsDB.length > 0){

            for (var BotChannelDB of BotChannelsDB){
                if (BotChannelDB.channeltype === channeltype){
                    botchannel = await module.exports.fetchGuildChannel( guild, BotChannelDB.channelid );
                    channelSet = true;
                    break;
                }
            }
            
            if( botchannel ){

                return botchannel;

            } else {

                if (channeltype !== `system`){

                    for (var BotChannelDB of BotChannelsDB){
                        if (BotChannelDB.channeltype === `system`){
                            botchannel = await module.exports.fetchGuildChannel( guild, BotChannelDB.channelid );
                            channelSystem = true;
                            break;
                        }
                    }

                }

            }

            if (!botchannel && channelSet){
                await MYSQL_DELETE('botchannel',{guildid: guild.id, channeltype: channeltype})
            }

            if (!botchannel && channelSystem && channeltype !== `system`){
                await MYSQL_DELETE('botchannel',{guildid: guild.id, channeltype: `system`})
            }

        }

        if (botchannel) {

            if (!channelSet && channelSystem){
                await module.exports.setGuildChannelDB(guild, channeltype, botchannel.id)
            }

        }

        if (!botchannel) {
            if( guild.systemChannelId === null ) {
                LogString( guild.name, `Error`, `Guild Channel`, `Системный канал гильдии отсутствует.` );
                return false;
            }

            botchannel = await module.exports.setGuildChannelDB( guild, channeltype, guild.systemChannelId );
        }
        
        return botchannel;
    },

    clearBindGuildChannels: async function ( guild ){
        await MYSQL_DELETE(`botchannel`, {guildid: guild.id});
    },

    setGuildChannelDB: async function ( guild, channeltype, BotChannelID ){
        var channel = await guild.channels.fetch(BotChannelID)
        if (!channel){
            if(guild.systemChannelId === null) {
                LogString(guild.name, `Error`, `Guild Channel`, `Системный канал гильдии отсутствует.`)
                return false
            }
            await SendAnswer( {channel: guild.systemChannel,
                guildname: guild.name,
                messagetype: `info`,
                title: `Guild Channel`,
                text:    `В качестве ${channeltype} установлен системный канал.`}  );
            await module.exports.setGuildChannelDB(guild, channeltype, guild.systemChannelId)
            return guild.systemChannel
        }
        if (await MYSQL_SAVE(`botchannel`, {channeltype: channeltype, guildid: guild.id}, {channelid: BotChannelID})){
            await SendAnswer( {channel: channel,
                guildname: guild.name,
                messagetype: `info`,
                title: `Guild Channel`,
                text:  `Канал **${channel}** установлен для сообщений типа **${channeltype}** `} );
            return channel
        } else {
            if(guild.systemChannelId === null) {
                LogString(guild.name, `Error`, `Guild Channel`, `Системный канал гильдии отсутствует.`)
                return false
            }
            await SendAnswer( {channel: guild.systemChannel,
                guildname: guild.name,
                messagetype: `Error`,
                title: `Guild Channel`,
                text:   `Не удалось установить канал для бота`} );
            return guild.systemChannel
        }

    },

    guildChannelShowSet: async function (comargs, message, com_text){
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('MANAGE_CHANNELS')){
            await SendError(message, com_text, `${message.author.username}, у Вас нет прав управлять каналами.`);
            return;
        }

        //показать текущий или установить стандартный
        if (typeof comargs === 'undefined' || comargs.length == 0) {

            const BotChannelsDB = await MYSQL_GET_ALL(`botchannel`, { guildid: message.guild.id } );

            if ( BotChannelsDB.length === 0 ){
                await module.exports.setGuildChannelDB( message.guild, 'system', message.channel.id );
            } else {
                let channels_text = ``;
                
                for (let BotChannelDB of BotChannelsDB){
                    channels_text += `${BotChannelDB.channeltype} <#${BotChannelDB.channelid}>\n`
                }

                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:    `Для сообщений бота установлены каналы:\n${channels_text}`,
                    mentionuser:  `${message.author}` } );
            }
            return;
        }

        //проверить тип канала
        var channeltype = comargs.shift().toLowerCase();

        function checkAllowedChannel(channeltype){
            var allowedTypesStartedWith = AllowedChannelsStartedWith.filter((val)=>channeltype.startsWith(val));
            return AllowedNamesOfGuildChannels().includes(channeltype) || allowedTypesStartedWith.length>0;
        }
        
        if (checkAllowedChannel(channeltype) == false){
            await SendError(message, com_text, `Нет такого типа канала`);
            return;
        }

        if (channeltype === `clear`){
            await module.exports.clearBindGuildChannels(message.guild)
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `Каналы бота были сброшены. Чтобы назначить выполните команду ${com_text.help}`,
                mentionuser:  `${message.author}` } );
            return;
        }

        var channel = await module.exports.checkArgsOfChannel(comargs, com_text, message)
        if (!channel) return       
        channel = await module.exports.setGuildChannelDB ( message.guild, channeltype, channel.id)
        await SendAnswer( {channel: message.channel,
            guildname: message.guild.name,
            messagetype: `info`,
            title: com_text.name,
            text:  `Теперь бот будет отвечать в канал: ${channel}`,
            mentionuser:  `${message.author}` } );

    },

    checkArgsOfChannel: async function (comargs, com_text, message){
        if (typeof comargs === 'undefined' || comargs.length == 0){
            return message.channel;
        }
        if (comargs[0].startsWith(`<#`) && comargs[0].charAt(comargs[0].length-1)==='>'){
            var channelid = comargs[0].replace('<#','').replace('>','')
            var channel = await message.guild.channels.cache.find(chan=>{
                return chan.id === channelid
            })
        } else {
            var channelname = comargs.join(" ").replace(/"/uig,'')
            var channel = await message.guild.channels.cache.find(chan=>{
                return chan.name === channelname
            })
        }
        if (!channel){
            await SendError(message, com_text, `Не получилось установить несуществующий канал`);
            return false
        }
        return channel
    },
}