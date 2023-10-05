const { log } = require('../../../tools/log.js');
const { formatAddZero } = require('../../../tools/time.js');
const { getBeatmapInfoByUrl } = require('../../stalker/osu.js');

module.exports = {
    command_name: `beatmap_info`,
    command_description: `информация о карте`,
    command_aliases: [`request`, `map`, `beatmap`, `карта`, `мапа`, `реквест`],
    command_help: `beatmap_info`,
    action: async ({channelname, tags, comargs, url, twitchchat})=>{

        let beatmap_url = url;

        if (!url){
            if (comargs.length == 0){
                //await twitchchat.say( channelname, `Нет ссылки` );
                return;
            }
    
            beatmap_url = comargs.shift();
        }

        const beatmap_info = await getBeatmapInfoByUrl( beatmap_url );

        if ( ! beatmap_info) {
            //log(  `[${channelname}] Неверная ссылка или карта не существует` );
            return;
        }

        console.log(`[${channelname}] ${tags.username} > beatmap_info (${beatmap_url}) `);
        await twitchchat.say( channelname, formatBeatmapInfo(beatmap_info) );

    }
}

const formatBeatmapInfo = (info) => {
    return [
        `[${info.id}] ${info.artist} - ${info.title} [${info.diff}] by ${info.creator}`,
        `${info.mode}`,
        `${info.status}`,
        `${info.stars} ★`,
        `${info.bpm} BPM`,
        `length: ${formatAddZero(Math.trunc(info.length / 60), 2)}:${formatAddZero(info.length % 60, 2)}`,
        `${info.max_combo}x`,
        `AR: ${info.ar}`,
        `CS: ${info.cs}`,
        `OD: ${info.od}`,
        `HP: ${info.hp}`
    ].join(' | ');
}
