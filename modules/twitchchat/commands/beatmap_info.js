const { formatAddZero } = require('../../../tools/time.js');
const { MYSQL_GET_IGNORE_TWITCH_CHATS, GET_TWITCH_OSU_BIND } = require('../../DB.js');
const { getBeatmapInfoByUrl } = require('../../stalker/osu.js');
const { ALL } = require('../constants/enumPermissions.js');
const { irc_say } = require('../tools/ircManager.js');

const { ModerationName } = require('../constants/general.js');

module.exports = {
    command_name: `beatmap_info`,
    command_description: `информация о карте`,
    command_aliases: [`request`, `map`, `beatmap`, `карта`, `мапа`, `реквест`],
    command_help: `beatmap_info`,
    command_permission: ALL,
    action: async ({channelname, tags, comargs, url}) => {
        
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

        //Send info

        if (tags.username === ModerationName) {
            await new Promise( res => setTimeout( res, 5000));
        }

        const osu_bind = await GET_TWITCH_OSU_BIND(tags['user-id']);

        if (osu_bind) {
            irc_say(osu_bind.osu_name, formatBeatmapInfoOsu(tags.username, beatmap_info.success) );
        }

        return  {success: formatBeatmapInfoTwitch(beatmap_info.success)}
    }
}

const formatBeatmapInfoOsu = (username, info) => {
    const url = `[${info.url} ${info.artist} - ${info.title} [${info.diff}] by ${info.creator}] >`;
    const pp = info.pps.length > 0 ? info.pps.map( val => `${val.acc}% > ${val.pp}pp`).join(' | '): '';
    const text = [
        info.status,
        /*`${info.stars} ★`,
        `${info.bpm} BPM`,
        `${info.max_combo}x`,
        `${formatAddZero(Math.trunc(info.length / 60), 2)}:${formatAddZero(info.length % 60, 2)}`,*/
        pp
    ];
    return `${username} > ${url} ${text.join(' | ')}`;
}

const formatBeatmapInfoTwitch = (info) => {
    return [
        `[${info.id}] ${info.artist} - ${info.title} [${info.diff}] by ${info.creator}`,
        `${info.mode}`,
        `${info.status}`,
        /*`${info.stars} ★`,
        `${info.bpm} BPM`,
        `Length: ${formatAddZero(Math.trunc(info.length / 60), 2)}:${formatAddZero(info.length % 60, 2)}`,
        `${info.max_combo}x`,
        `AR: ${info.ar}`,
        `CS: ${info.cs}`,
        `OD: ${info.od}`,
        `HP: ${info.hp}`,*/
        info.pps.length > 0 ? info.pps.map( val => `${val.acc}%=${val.pp}pp`).join(' ▸'): 'no calc pp'
    ].join(' ▸');
}
