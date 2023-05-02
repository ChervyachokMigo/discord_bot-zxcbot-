const {modules} = require(`../settings.js`)
const { VoiceRolesClearFromUsers, AllVoiceRolesSet } = require("../modules/VoicesRoles.js")

module.exports = async (role) =>{
    if (modules.voiceroles){
        await VoiceRolesClearFromUsers( role.guild )
        await AllVoiceRolesSet( role.guild.channels, role.guild )
    }
}