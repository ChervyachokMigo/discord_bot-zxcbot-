const { checkReply, getMessageDiscordURL, checkArgsOfEmoji } = require("./tools.js")
const { checkArgsOfRole, fetchRole, RoleToUser } = require("./roles.js")

const { MYSQL_SAVE, MYSQL_DELETE, MYSQL_GET_ONE } = require("./DB/base.js");
const { SendAnswer, SendError } = require("../tools/embed.js")
const { getGuildChannelDB } = require (`./GuildChannel.js`)

const log = console.log.bind(console)

module.exports = {
    ReactionRoleSet: async function ( comargs, message, com_text ){

        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has("MANAGE_ROLES")){
            await SendError(message, com_text, `${message.author.username}, у Вас нет прав управлять ролями.`);
            return
        }
        
        if (comargs[0] === 'clear' && comargs[1] === 'guild'){
            await MYSQL_DELETE (`reactionrole`, {guildid: message.guild.id})
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${message.author.username}, сообщения гильдии очищены от реакций ролей`,
                mentionuser:  `${message.author}` } );
            return
        }

        if (!await checkReply(message, com_text)) return

        var referenceUrl = getMessageDiscordURL(message, message.reference.messageId)

        if (comargs[0] === 'clear'){
            await MYSQL_DELETE (`reactionrole`, {guildid: message.guild.id, messageid: message.reference.messageId})
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${message.author.username}, [сообщение](${referenceUrl}) очищено от реакций`,
                mentionuser:  `${message.author}` } );
            return
        }

        var reactionrole_emoji = await checkArgsOfEmoji(comargs[0], com_text, message)
        if (!reactionrole_emoji) return

        var reactionrole_role = await checkArgsOfRole(comargs[1], com_text, message)
        if (!reactionrole_role) return

        var newraw = NewReactionRoleValues(
            message.guild.id,
            message.reference.messageId,
            reactionrole_emoji,
            reactionrole_role.id)
        
        //должна быть проверка на права роли

        if (
            await MYSQL_SAVE(`reactionrole`, 
                { guildid: newraw.dataValues.guildid, messageid:  newraw.dataValues.messageid, emoji: newraw.dataValues.emoji }, 
                { emojitype: newraw.dataValues.emojitype, roleid: newraw.dataValues.roleid })

        ){
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${message.author.username}, к реакции ${comargs[0]} на [сообщение](${referenceUrl}) привязана роль ${comargs[1]}`,
                mentionuser:  `${message.author}` } );
        }
    },

    ReactionRoleAction: async function(actionname, reaction, user){
        var RoleToAction = await module.exports.CheckReactionRoleDB ( reaction )
        if (RoleToAction){
            if (await RoleToUser(actionname, await reaction.message.guild.members.fetch(user.id), RoleToAction.id, `Reaction Roles`)){
                let channel = await getGuildChannelDB( reaction.message.guild, 'system' );
                await SendAnswer( {channel: channel,
                    guildname: reaction.message.guild.name,
                    messagetype: `info`,
                    title: 'Reaction Role',
                    text:   `${user} ${actionname==='add'?'добавлена':'удалена'} роль ${RoleToAction}`} );
            }    
        }
    },

    CheckReactionRoleDB: async function ( reaction ){
        var emojiid
        if (reaction.emoji.id !== null){
            emojiid = reaction.emoji.id
        } else {
            emojiid = reaction.emoji.name
        }

        var ReactionRoleData = {
            guildid: reaction.message.guildId,
            messageid: reaction.message.id,
            emoji: emojiid
        }

        var reactionroledb = await MYSQL_GET_ONE(`reactionrole`, ReactionRoleData )
               
        if (!reactionroledb) return false
    
        reactionroledb = reactionroledb.dataValues

        if (reactionroledb.id){            
            var ActionRole = await fetchRole(reaction.message.guild, reactionroledb.roleid)
            if ( typeof ActionRole === 'undefined'){
                await MYSQL_DELETE(`reactionrole`, ReactionRoleData)
                let channel = await getGuildChannelDB( reaction.message.guild, 'system' );
                await SendAnswer( {channel: channel,
                    guildname: reaction.message.guild.name,
                    messagetype: `info`,
                    title: 'Reaction Role',
                    text:    `Реакция на роль удалена, потому что роль не найдена в гильдии.`} , 
               );
                return false
            }
            return ActionRole
        }
        return false
    },

}

function NewReactionRoleValues (gid, mid, emoji, rid){
    var newraw = {dataValues: {} }
    newraw.dataValues.guildid = gid
    newraw.dataValues.messageid = mid
    newraw.dataValues.emojitype = emoji.emojitype
    newraw.dataValues.emoji = emoji.id
    newraw.dataValues.roleid = rid
    return newraw
}