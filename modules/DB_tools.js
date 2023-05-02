const { checkArgsOfRole } = require("./roles.js")
const { checkArgsOfUser } = require("./tools.js")
const { MYSQL_SAVE, MYSQL_GET_ONE } = require (`./DB.js`)

const { getGuildChannelDB } = require (`./GuildChannel.js`)
const { SendAnswer, SendError } = require("../tools/embed.js")

module.exports = {
    CheckUser: async function ( channel, userid ){
        
        var balancedb = await MYSQL_GET_ONE(`user`,{guildid:channel.guild.id, userid:userid })
        if (balancedb === null){
            var res = await MYSQL_SAVE( `user`, 
                {guildid: channel.guild.id, userid: userid}, 
                {coins: 0})
            if (!res) {
                var channel = await getGuildChannelDB( message.guild, `system` )
                await SendAnswer( {channel: channel,
                    guildname: channel.guild.name,
                    messagetype: `Error`,
                    title: 'База данных',
                    text:  `Нет доступа к базе данных` } );
            }
            return res.dataValues
        } else {
            return balancedb
        }
    },

    getSteam: async function ( channel, userid ){
        var usrdb = await DB_Get(`steam:${userid}`)
        if (typeof usrdb === 'undefined'){
            return {}
        } else {
            return usrdb
        }
    },

    CheckRole: async function ( argString, com_text, message){
        let role = await checkArgsOfRole(argString, com_text, message)
        if (!role) return false
    
        var roledb = await MYSQL_GET_ONE(`role`, { guildid: message.channel.guild.id, roleid:role.id })
        if (roledb === null){
            var res = await MYSQL_SAVE( `role`, 
                {guildid: message.channel.guild.id, roleid: role.id}, 
                {price: -1})
            return res.dataValues
        } else {
            return roledb
        }
    },

    blockUserStateChange: async function( blockState, userArg, message, com_text ){
        var channel = await getGuildChannelDB( message.guild, `system` )
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('MUTE_MEMBERS'|'BAN_MEMBERS'|'MODERATE_MEMBERS'|'DEAFEN_MEMBERS')){
            await SendError(message, com_text, `${message.author.username}, у Вас нет прав управлять банами.`);
            return
        }
        var userid = await checkArgsOfUser(userArg, com_text, message)
        if (!userid) return

        var username = (await message.guild.members.fetch(userid)).user.username

        var userdb = await module.exports.CheckUser ( message.channel, userid )
        userdb.restricted = blockState

        await MYSQL_SAVE( `user`, 
            {guildid: message.channel.guild.id, userid: userid}, 
            {restricted: userdb.restricted})

        if (blockState == true) {
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${username} был заблокирован для команд бота.`,
                mentionuser:  `${userArg}` } );
        } else {
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${username} был разблокирован для команд бота.`,
                mentionuser:  `${userArg}` } );
        }

        return userdb
    },

    checkBlock: async function (message){
        var userdb = await module.exports.CheckUser ( message.channel, message.author.id )
        return userdb.restricted
    }

}