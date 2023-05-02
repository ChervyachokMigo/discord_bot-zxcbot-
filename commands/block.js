
const { blockUserStateChange } = require (`../modules/DB_tools.js`);

module.exports = {
    command_name: `Block User State`, 
    command_description: `Блокирует юзера для выполнения любых команд бота.`,
    command_aliases: [`block`],
    command_help: `block @user`,
    action: async (comargs, message)=>{
        await blockUserStateChange(true, comargs[0], message, {name: module.exports.command_name,
            help: module.exports.command_help } )
    }
}