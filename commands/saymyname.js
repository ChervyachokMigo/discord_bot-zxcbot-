const { saymyname } = require (`../modules/tools.js`);
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Say my name`,
    command_description: `Скажи своё имя`,
    command_aliases: [`saymyname`],
    command_help: `saymyname`,
    action: async (comargs, message)=>{
        if (modules.saymyname){
            await saymyname(message)}
    }
}