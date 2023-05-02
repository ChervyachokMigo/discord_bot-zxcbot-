const { ReactionRoleSet } = require("../modules/ReactionRoles.js");
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Reaction Role`,
    command_description: `Установить сообщению выдачу ролей за реакцию.`,
    command_aliases: [`reactionrole`, `rr`],
    command_help: `reactionrole :reaction: @role\nreactionrole clear`,
    action: async (comargs, message)=>{
        if (modules.reactionroles){
            await ReactionRoleSet( comargs, message, {name: module.exports.command_name,
                help: module.exports.command_help })}
    }
}