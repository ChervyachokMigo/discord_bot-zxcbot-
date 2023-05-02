const { getSumCommandAction } = require (`../modules/tools.js`);
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Sum`,
    command_description: `Суммировать несколько чисел`,
    command_aliases: [`sum`],
    command_help: `sum <value> <value> ... <value>`,
    action: async (comargs, message)=>{
        if (modules.sum){
            await getSumCommandAction(comargs, message, {name: module.exports.command_name, help: module.exports.command_help })}
    }
}