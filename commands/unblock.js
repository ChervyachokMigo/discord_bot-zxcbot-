const { blockUserStateChange } = require (`../modules/DB_tools.js`);

module.exports = {
    command_name: `Unblock User State`, 
    command_description: `Разблокирует юзера для выполнения любых команд бота.`,
    command_aliases: [`unblock`],
    command_help: `unblock @user`,
    action: async (comargs, message)=>{
        await blockUserStateChange(false, comargs[0], message, {name: module.exports.command_name,
            help: module.exports.command_help } )
    }
}