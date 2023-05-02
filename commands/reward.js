const { rewardCommandAction } = require (`../modules/balance.js`);
const { modules, modules_balance } = require (`../settings.js`);

module.exports = {
    command_name: `Balance Reward`,
    command_description: `Вознаградить пользователя монетой.`,
    command_aliases: [`reward`, `gift`],
    command_help: `reward @user <value>`,
    action: async (comargs, message)=>{
        if (modules.balance){
            if (modules_balance.reward){
                await rewardCommandAction( comargs, message, {name: module.exports.command_name,
                    help: module.exports.command_help } )}}
    }
}