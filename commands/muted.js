const { printMutedList } = require (`../modules/restrictCheck.js`);
const { modules } = require (`../settings.js`);

module.exports = {
    command_name: `Restricted userlist`,
    command_description: `Посмотреть список замьюченых.`,
    command_aliases: [`muted`],
    command_help: `muted`,
    action: async (comargs, message)=>{
        if (modules.restrict){
            await printMutedList(message)}
    }
}