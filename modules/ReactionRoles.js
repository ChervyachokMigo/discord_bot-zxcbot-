const { checkReply, getMessageDiscordURL, checkArgsOfEmoji } = require("./tools.js")
const { checkArgsOfRole, fetchRole, RoleToUser } = require("./roles.js")

const { SendAnswer, SendError } = require("../tools/embed.js")
const { getGuildChannelDB } = require (`./GuildChannel.js`)
const { MYSQL_SAVE, MYSQL_DELETE, MYSQL_GET_ONE } = require("mysql-tools")

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

        const referenceUrl = getMessageDiscordURL(message, message.reference.messageId)

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

        const reactionrole_emoji = await checkArgsOfEmoji(comargs[0], com_text, message)
        if (!reactionrole_emoji) return

        const reactionrole_role = await checkArgsOfRole(comargs[1], com_text, message)
        if (!reactionrole_role) return
        
        //должна быть проверка на права роли

        if ( await MYSQL_SAVE(`reactionrole`, {
				guildid: message.guild.id,
				messageid: message.reference.messageId,
				emoji: reactionrole_emoji.id,
				emojitype: reactionrole_emoji.emojitype,
				roleid: reactionrole_role.id
			}) ){
            await SendAnswer({
                channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${message.author.username}, к реакции ${comargs[0]} на [сообщение](${referenceUrl}) привязана роль ${comargs[1]}`,
                mentionuser:  `${message.author}` 
            });
        }
    },

    ReactionRoleAction: async function(actionname, reaction, user){
        const RoleToAction = await module.exports.CheckReactionRoleDB ( reaction )
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

        let emoji = reaction.emoji.name;

        if (reaction.emoji.id !== null){
            emoji = reaction.emoji.id
        }

        const ReactionRoleRequest = {
            guildid: reaction.message.guildId,
            messageid: reaction.message.id,
            emoji
        }

        const mysql_data = await MYSQL_GET_ONE(`reactionrole`, ReactionRoleRequest )

        if (mysql_data === null) return false;

        if (mysql_data.id){
            const ActionRole = await fetchRole(reaction.message.guild, mysql_data.roleid);
            if ( typeof ActionRole === 'undefined'){
                await MYSQL_DELETE(`reactionrole`, ReactionRoleRequest)
                let channel = await getGuildChannelDB( reaction.message.guild, 'system' );
                await SendAnswer({
                    channel,
                    guildname: reaction.message.guild.name,
                    messagetype: `info`,
                    title: 'Reaction Role',
                    text:    `Реакция на роль удалена, потому что роль не найдена в гильдии.`
                });
                return false
            }
            return ActionRole
        }
        return false
    },

}