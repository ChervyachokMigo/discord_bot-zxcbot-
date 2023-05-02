const { giveCommandAction } = require (`../modules/balance.js`);
const { modules, modules_balance } = require (`../settings.js`);

module.exports = {
    command_name: `Balance Give`,
    command_description: `Передать монеты юзеру.`,
    command_aliases: [`give`],
    command_help: `give @user <value>`,
    action: async (comargs, message)=>{
        if (modules.balance){
            if (modules_balance.give){
                await giveCommandAction( comargs, message, {name: module.exports.command_name,
                    help: module.exports.command_help })}}
    }
}