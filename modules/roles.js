const { getGuildChannelDB } = require (`./GuildChannel.js`)
const { SendAnswer, SendError } = require("../tools/embed.js")

const log = console.log.bind(console)

module.exports = {
    checkArgsOfRole: async function ( argString, com_text, message ){
        if (typeof argString === 'undefined' || !(argString.startsWith('<@&') && argString.charAt(argString.length-1)==='>')){
            await SendError(message, com_text, `Не указана роль`);
            return false
        }

        if (message.mentions.roles.size > 0 ){

            var role_result = [...message.mentions.roles][0][1];

            if (await module.exports.isRoleBot(role_result)){
                await SendError(message, com_text, `С ролью бота ${role_result} ничего нельзя сделать`);
                return false
            }

            return role_result

        } else {
            await SendError(message, com_text, `В гильдии нет такой роли`);
            return false
        }
    },

    isRoleBot: async function (role){
        if (typeof role !== 'undefined'){

            if (role.name === '@everyone' && role.name === '@here'){ 
                return true;
            }
            
            if (role && role.tags && role.tags.botId ){
                return true;
            }
            
        }

        return false;
    },

    RoleToUser: async function (action, Member, roleid, error_title){
        var channel = await getGuildChannelDB( Member.guild, `system` )
        try {
            var role = await module.exports.fetchRole(Member.guild, roleid)
            if (typeof role === 'undefined'){
                log ('trying undefined role interaction')
                await SendAnswer( {channel: channel,
                    guildname: Member.guild.name,
                    messagetype: `Error`,
                    title: error_title,
                    text:   `Не существующая роль`} );
                return
            }
            if (action === 'add'){
                await Member.roles.add(role.id)}
            if (action === 'remove'){
                await Member.roles.remove(role.id)}
        } catch (e) {
            if (e.code == 50013){
                await SendAnswer( {channel: channel,
                    guildname: Member.guild.name,
                    messagetype: `Error`,
                    title: error_title,
                    text:  `Управления ролью, к которой нет прав`} );
                return false 
            } else {
                log(e)
                await SendAnswer( {channel: channel,
                    guildname: Member.guild.name,
                    messagetype: `Error`,
                    title: error_title,
                    text:  `Ошибка. Чек консоль`} );
                return false 
        }}
        return true
    },

    fetchRole: async function (guild, roleid){
        var role_result = await guild.roles.cache.find((roles) => roles.id === roleid)
        return role_result
    },

}