const { make_beatmaps_db, md5_stock_compare, md5_stock_calculate } = require("../osu_pps/beatmaps_md5_stock.js");
const { SendError } = require("../tools/embed.js");
const { log } = require("../tools/log.js");

module.exports = {
    command_name: `checkdb`,
    command_description: `Проверка хранилища карт осу`,
    command_aliases: [`checkdb`],
    command_help: `checkdb`,
    action: async (comargs, message)=>{
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
            await SendError(
                message, 
                {name: module.exports.command_name, help: module.exports.command_help }, 
                `${message.author.username}, у Вас нет прав для этого действия.`);
            return
        }
        log('make beatmaps db', 'check db command')
        make_beatmaps_db();
        log('comparing stock', 'check db command')
        md5_stock_compare();
        log('calculate pp', 'check db command')
        md5_stock_calculate();
    }
}