const { MYSQL_GET_IGNORE_TWITCH_CHATS } = require('../../DB.js');
const { getScoreInfoByUrl } = require('../../stalker/osu.js');
const { ALL } = require('../constants/enumPermissions.js');

module.exports = {
    command_name: `score_info`,
    command_description: `информация о скоре`,
    command_aliases: [`score`, `скор`],
    command_help: `score_info`,
    command_permission: ALL,
    action: async ({channelname, tags, comargs, url})=>{
        
        const TwitchChatIgnoreChannels = await MYSQL_GET_IGNORE_TWITCH_CHATS();

        if ( TwitchChatIgnoreChannels.includes(tags.username)) {
            return {error: `[${channelname}] ${tags.username} > в списке игнорируемых каналов `}
        }
        
        let score_url = url;

        if (!url){
            if (url_parts === null) {
                return {error: `ссылка не скор`};
            }
    
            score_url = comargs.shift();
        }

        const score_info = await getScoreInfoByUrl( score_url );

        if ( score_info.error) {
            return {error: `[${channelname}] ${tags.username} > ${beatmap_info.error} > `};
        }

        return {success: formatScoreInfo(score_info.success)};

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