const { formatAddZero } = require('../../../tools/time.js');
const { MYSQL_GET_IGNORE_TWITCH_CHATS } = require('../../DB.js');
const { getBeatmapInfoByUrl } = require('../../stalker/osu.js');

module.exports = {
    command_name: `beatmap_info`,
    command_description: `информация о карте`,
    command_aliases: [`request`, `map`, `beatmap`, `карта`, `мапа`, `реквест`],
    command_help: `beatmap_info`,
    action: async ({channelname, tags, comargs, url})=>{
        
        const TwitchChatIgnoreChannels = await MYSQL_GET_IGNORE_TWITCH_CHATS();

        if ( TwitchChatIgnoreChannels.includes(tags.username)) {
            return {error: `[${channelname}] ${tags.username} > в списке игнорируемых каналов `}
        }
    
        let beatmap_url = url;

        if (!url){
            if (comargs.length == 0){
                return {error: `[${channelname}] ${tags.username} > Нет ссылки `}
            }
    
            beatmap_url = comargs.shift();
        }

        const beatmap_info = await getBeatmapInfoByUrl( beatmap_url );

        if ( beatmap_info.error ) {
            return {error: `[${channelname}] ${tags.username} > ${beatmap_info.error} > `}
        }

        return  {success: formatBeatmapInfo(beatmap_info.success)}
    }
}

const formatBeatmapInfo = (info) => {
    return [
        `[${info.id}] ${info.artist} - ${info.title} [${info.diff}] by ${info.creator}`,
        `${info.mode}`,
        `${info.status}`,
        `${info.stars} ★`,
        `${info.bpm} BPM`,
        `Length: ${formatAddZero(Math.trunc(info.length / 60), 2)}:${formatAddZero(info.length % 60, 2)}`,
        `${info.max_combo}x`,
        `AR: ${info.ar}`,
        `CS: ${info.cs}`,
        `OD: ${info.od}`,
        `HP: ${info.hp}`
    ].join(' ▸');
}
