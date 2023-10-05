const { log } = require('../../../tools/log.js');
const { getScoreInfoByUrl } = require('../../stalker/osu.js');

module.exports = {
    command_name: `score_info`,
    command_description: `информация о скоре`,
    command_aliases: [`score`, `скор`],
    command_help: `score_info`,
    action: async ({channelname, tags, comargs, url, twitchchat})=>{
        let score_url = url;

        if (!url){
            if (comargs.length == 0){
                //await twitchchat.say( channelname, `Нет ссылки` );
                return;
            }
    
            score_url = comargs.shift();
        }

        const score_info = await getScoreInfoByUrl( score_url );

        if ( ! score_info) {
            //log(  `[${channelname}] Неверная ссылка или карта не существует` );
            return;
        }

        console.log(`[${channelname}] ${tags.username} > score_info (${score_url}) `);
        await twitchchat.say( channelname, formatScoreInfo(score_info) );

    }
}

const formatScoreInfo = (info) => {
    return [
        `[${info.mode} score] by ${info.username} [#${info.rank_global}] `,
        `${info.beatmap_artist} - ${info.beatmap_title} [${info.beatmap_diff}] by ${info.beatmap_creator} (${info.mods})`,
        `rank: ${info.rank}`,
        `${info.accuracy}%`,
        `${info.score_combo}/${info.beatmap_combo}x`,
        `${info.pp} pp`,
        `${info.count300}/${info.count100}/${info.count50}/${info.countgeki}/${info.countkatu}/${info.count0}`,
    ].join(' | ');
}