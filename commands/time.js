const { getTimeMSKCurrentToStringFormat } = require("../tools/time.js");
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Time`,
    command_description: `Вывести текущее московское время.`,
    command_aliases: [`time`],
    command_help: `time`,
    action: async (comargs, message)=>{
        if (modules.time){
            await message.reply(getTimeMSKCurrentToStringFormat())}
    }
}