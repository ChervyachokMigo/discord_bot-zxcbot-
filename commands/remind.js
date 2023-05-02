const { RemindCommandAction } = require("../modules/remind.js");
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Remind`,
    command_description: `Поставить таймер-напоминалку.`,
    command_aliases: [`remind`, `timer`],
    command_help: `remind [type <time> text]`,
    action: async (comargs, message)=>{
        if (modules.remind){
            await RemindCommandAction( comargs, message, {name: module.exports.command_name,
                help: module.exports.command_help } )}
    }
}