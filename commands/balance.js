const { balanceCommandAction } = require (`../modules/balance.js`);
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Balance`, 
    command_description: `Показывает свой баланс на сервере или баланс юзера.`,
    command_aliases: [`balance`],
    command_help: `balance [@user]`,
    action: async (comargs, message)=>{
    if (modules.balance){
        await balanceCommandAction(comargs[0], message, {name: module.exports.command_name,
            help: module.exports.command_help })
    }}
}