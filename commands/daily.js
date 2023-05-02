const { dailyCommandAction } = require (`../modules/Daily.js`);
const { modules, modules_balance } = require (`../settings.js`);

module.exports = {
    command_name: `Daily`,
    command_description: `Получение монет сервера.`,
    command_aliases: [`daily`],
    command_help: `daily`,
    action: async (comargs, message)=>{
        if (modules.balance){
            if (modules_balance.daily){
                await dailyCommandAction( message, {name: module.exports.command_name,
                    help: module.exports.command_help } )}}
    }
}