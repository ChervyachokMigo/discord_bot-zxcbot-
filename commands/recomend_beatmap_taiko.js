const { modules } = require (`../settings.js`);

const { SendAnswer, SendError } = require("../tools/embed.js");

const { taiko_farming_maps_get_random_beatmap } = require('../modules/taiko_recomend_map/index.js');

module.exports = {
    command_name: `Recomend beatmap for taiko`,
    command_description: `Отправить рандомную карту по разнице звезд в стандартном клиенте и лазере.`,
    command_aliases: [`recomend`, `rec`, `r`],
    command_help: `rec <min_stars_value> <max_stars_value> <min_stars_difference> <max_stars_difference>`,
    action: async (comargs, message)=>{
        if (modules.taiko_map_recomend){
    
            var min_stars = Number(comargs.shift());
            var max_stars = Number(comargs.shift());
            var min_stars_difference = Number(comargs.shift());
            var max_stars_difference = Number(comargs.shift());

            if (isNaN(min_stars) || isNaN(max_stars) || isNaN(min_stars_difference)){
                await SendError(message, 
                    {name: module.exports.command_name, help: module.exports.command_help }, 
                    `Напишите значения правильно`);
                return  
            }
            if (isNaN(max_stars_difference)){
                max_stars_difference = 99;
            }

            var beatmaps_result = taiko_farming_maps_get_random_beatmap(min_stars, max_stars, min_stars_difference, max_stars_difference);

            if (!beatmaps_result){
                await SendError(message, 
                    {name: module.exports.command_name, help: module.exports.command_help }, 
                    `Не найдено не одной карты по такому запросу. Попробуйте еще раз`);
                return  
            }

            var result = ``;
            result += `old starrate: **${beatmaps_result.beatmap_data.star_taiko_local}**★\nnew starrate: **${beatmaps_result.beatmap_data.star_taiko_lazer}**★\n`;
            result += `starrate difference: **${beatmaps_result.star_difference}**★\n`;
            result += `**direct:** osu://b/${beatmaps_result.beatmap_data.beatmap_id}`;

            await SendAnswer({
                channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${beatmaps_result.beatmap_data.artist} - ${beatmaps_result.beatmap_data.title}`,
                text: `${result}`,
                url:  `https://osu.ppy.sh/beatmapsets/${beatmaps_result.beatmap_data.beatmapset_id}#taiko/${beatmaps_result.beatmap_data.beatmap_id}`
            });
                 
        }
    }
}
