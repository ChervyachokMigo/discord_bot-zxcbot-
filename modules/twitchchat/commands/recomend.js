
const { SELF } = require("../constants/enumPermissions");
const { find } = require("../tools/Recommends");
const { get_beatmap_info_by_md5 } = require("../../stalker/osu");
const minimist = require('minimist');
const { GET_TWITCH_OSU_BIND } = require("../../DB");
const { irc_say } = require("../tools/ircManager");
module.exports = {
    command_name: `recomend`,
    command_description: `Дать карту`,
    command_aliases: [`recomend`, `r`, `rec`],
    command_help: `recomend`,
    command_permission: SELF,
    action: async ({channelname, tags, comargs})=>{
        const args = minimist(comargs);

        let n = 1;
        if (args.n){
            n = parseInt(args.n)
        }

        const acc_default = 100;
        let acc = acc_default;
        if (args.acc){
            acc = parseInt(args.acc);
            const acc_available = [95,97,98,99,100];
            if (acc_available.indexOf(acc) == - 1) {
                acc = acc_default;
            }
        }


        const pp_default = 330;
        let pp = pp_default;
        if (args.pp){
            pp = parseInt(args.pp);
        }

        const pp_diff_default = 10;
        let pp_diff = pp_diff_default;
        if (args.pp_diff){
            pp_diff = parseInt(args.pp_diff);
        }

        
        let pp_min = Math.floor(pp - pp_diff * 0.5);
        if (args.pp_min){
            pp_min = parseInt(args.pp_min);
        }

        let pp_max = Math.floor(pp + pp_diff * 0.5);
        if (args.pp_max){
            pp_max = parseInt(args.pp_max);
        }

        let aim = null
        if (args.aim){
            aim = Number(args.aim);
        }

        let notify_chat = true;
        if(typeof args.notify_chat === 'string' && args.notify_chat === 'false' || typeof args.notify_chat === 'number' && args.notify_chat === 0){
            notify_chat = false;
        }

        for (let i= 0; i<n ; i++){
            const beatmap = await find({username: tags.username, acc, pp_min, pp_max, aim});

            if (!beatmap){
                return {error: '[recomend] > error no founded beatmap'}
            }

            const beatmap_info = get_beatmap_info_by_md5(beatmap.md5);
            if (beatmap_info){
                const osu_bind = await GET_TWITCH_OSU_BIND(tags['user-id']);

                if (osu_bind) {
                    irc_say(osu_bind.osu_name, formatBeatmapInfoOsu(tags.username, {...beatmap, ...beatmap_info, acc}) );
                }

                if (n === 1) {
                    if (notify_chat){
                        return  {success: formatMap({...beatmap, ...beatmap_info, acc})};
                    } else {
                        return {error: 'no notify chat'}
                    }
                }
            }
        }

        if  (n > 1) {
            return {error: 'sended '+n+' maps'}
        }

        return {error: '[recomend] > error beatmap id'}
    }
}

const formatBeatmapInfoOsu = (username, {pps, beatmapsetid, beatmapid, title, artist, acc}) => {
    const url = `[https://osu.ppy.sh/beatmapsets/${beatmapsetid}#osu/${beatmapid} ${artist} - ${title}] >`;
    const pp = pps.length > 0 ? pps
        .filter( x => x.acc === acc)
        .map( val => `${val.acc}% > ${Math.round(val.pp.total)}pp | aim: ${Math.round(val.pp.aim)}pp | speed: ${Math.round(val.pp.speed)}pp`)
        .join(' | '): '';
    return `${username} > ${url} ${pp}`;
}

const formatMap = ({pps, beatmapsetid, beatmapid, artist, title, acc}) => {
        const ss = pps.find( x => x.acc === acc);

        return [`${artist} - ${title}`,
        `${acc}%=${Math.round(ss.pp.total)}pp`, 
        `aim=${Math.round(ss.pp.aim)}pp`,
        `speed=${Math.round(ss.pp.speed)}pp`,
        `accuracy=${Math.round(ss.pp.accuracy)}pp`,
        `diff=${ss.diff.star.toFixed(2)} ★`,
        `aim=${ss.diff.aim.toFixed(2)} ★`,
        `speed=${ss.diff.speed.toFixed(2)} ★`,
        `https://osu.ppy.sh/beatmapsets/${beatmapsetid}#osu/${beatmapid}`].join(' | ');
    
}