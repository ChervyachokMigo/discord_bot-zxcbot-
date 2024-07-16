const { roleShowSet } = require (`../modules/balance.js`);
const { modules, modules_balance } = require (`../settings.js`);

module.exports = {
    command_name: `Role`,
    command_description: `Установить роли цену или посмотреть стоимость.`,
    command_aliases: [`role`],
    command_help: `role @role [<price>]`,
    action: async (comargs, message)=>{
        if (modules.balance){
            if (modules_balance.rolebuy){
                await roleShowSet( comargs, message, {
					name: module.exports.command_name,
                    help: module.exports.command_help 
				});
            }
        }
    }
}