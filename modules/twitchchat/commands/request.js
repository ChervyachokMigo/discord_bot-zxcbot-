const { formatAddZero } = require('../../../tools/time.js');
const { getBeatmapInfoByUrl } = require('../../stalker/osu.js');

module.exports = {
    command_name: `request`,
    command_description: `информация о карте`,
    command_aliases: [`request`, `map`, `beatmap`, `карта`, `мапа`, `реквест`],
    command_help: `request`,
    action: async ({channelname, tags, comargs, twitchchat})=>{
        if (comargs.length == 0){
            await twitchchat.say( channelname, `Нет ссылки` );
            return;
        }

        const url = comargs.shift();

        const beatmap_info = await getBeatmapInfoByUrl( url );

        if ( ! beatmap_info) {
            await twitchchat.say( channelname, `Неверная ссылка или карта не существует` );
            return;
        }

        await twitchchat.say( channelname, formatBeatmapInfo(beatmap_info) );

    }
}

const formatBeatmapInfo = (info) => {
    return [
        `[${info.id}] ${info.artist} - ${info.title} [${info.diff}] by ${info.creator}`,
        `status: ${info.status}`,
        `mode: ${info.mode}`,
        `stars: ${info.stars}`,
        `bpm: ${info.bpm}`,
        `length: ${formatAddZero(Math.trunc(info.length / 60))}:${formatAddZero(info.length % 60)}`,
        `max combo: ${info.max_combo}`,
        `AR: ${info.ar}`,
        `CS: ${info.cs}`,
        `OD: ${info.od}`,
        `HP: ${info.hp}`
    ].join(' | ');
}