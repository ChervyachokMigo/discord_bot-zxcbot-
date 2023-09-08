const { VoiceRoleSet } = require("../modules/VoicesRoles.js");
const { modules }  = require (`../settings.js`);

module.exports = {
    command_name: `Voice Roles`,
    command_description: `Установить каналу выдачу роли при входе.`,
    command_aliases: [`voicerole`, `vr`],
    command_help: `voicerole [channel name] [@role]\nvoicerole ["channel name"] [@role]\nvoicerole clear`,
    action: async (comargs, message)=>{
        if (modules.voiceroles){
            await VoiceRoleSet( comargs, message, 
                {name: module.exports.command_name, help: module.exports.command_help });
        }
    }
}