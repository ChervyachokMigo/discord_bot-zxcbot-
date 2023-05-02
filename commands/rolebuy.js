const { roleBuyCommandAction } = require (`../modules/balance.js`);
const { modules, modules_balance } = require (`../settings.js`);

module.exports = {
    command_name: `Buy Role`,
    command_description: `Купить роль за монеты.`,
    command_aliases: [`rolebuy`, `buyrole`],
    command_help: `rolebuy @role`,
    action: async (comargs, message)=>{
        if (modules.balance){
            if (modules_balance.rolebuy){
                await roleBuyCommandAction( comargs, message, {name: module.exports.command_name,
                    help: module.exports.command_help })}}
    }
}