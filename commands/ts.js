const { Translate } = require (`../modules/tools.js`);
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Translate`,
    command_description: `Перевести рааскладку с ENG на RUS или обратно.`,
    command_aliases: [`translate`, `ts`],
    command_help: `ts`,
    action: async (comargs, message)=>{
        if (modules.translate){
            await Translate(message, {name: module.exports.command_name, help: module.exports.command_help })}
    }
}