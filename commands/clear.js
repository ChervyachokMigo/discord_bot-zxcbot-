const { clearCommand } = require (`../modules/clear.js`);

module.exports = {
    command_name: `Clear messages`, 
    command_description: `Удаляет последние <N> сообщений с канала`,
    command_aliases: [`clear`, `purge`],
    command_help: `clear <count>`,
    action: async (comargs, message)=>{
        await clearCommand(comargs, message, {name: module.exports.command_name,
            help: module.exports.command_help })

    }
}