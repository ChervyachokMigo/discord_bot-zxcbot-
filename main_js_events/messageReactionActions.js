const { modules } = require(`../settings.js`)
const { ReactionRoleAction } = require("../modules/ReactionRoles.js")

module.exports = async (action, reaction, user) => {
    
    if (modules.reactionroles){
        await ReactionRoleAction ( action, reaction, user)
    }
    
}