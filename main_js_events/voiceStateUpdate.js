const {modules} = require(`../settings.js`)
const { LogString } = require("../tools/log.js")
const { UpdateVoiceRoles, removeUndefinedVoicesRoles } = require("../modules/VoicesRoles.js")

module.exports = async (newState, oldState) => {
    if (oldState.channelId) {
        if (modules.voiceroles){
            await removeUndefinedVoicesRoles( oldState.member.guild ) 
            await UpdateVoiceRoles('disconnected', oldState.channelId, oldState.member )
            LogString(oldState.guild, `info`, `Voices Roles`, `${oldState.member.user.username} отключился из ${oldState.channel.name}`)
        }
    }
    if (newState.channelId) {
        if (modules.voiceroles){
            await removeUndefinedVoicesRoles( oldState.member.guild ) 
            await UpdateVoiceRoles('connected', newState.channelId, oldState.member )
            LogString(newState.guild, `info`, `Voices Roles`, `${oldState.member.user.username} подключился к ${newState.channel.name}`)
        }
    }
}