
const { SELF } = require("../constants/enumPermissions");
const { find } = require("../tools/Recommends");
const { get_beatmap_info_by_md5 } = require("../../stalker/osu");

module.exports = {
    command_name: `recomend`,
    command_description: `Дать карту`,
    command_aliases: [`recomend`, `r`, `rec`],
    command_help: `recomend`,
    command_permission: SELF,
    action: async ({channelname, tags, comargs})=>{

        const beatmap = find({acc: 100, pp_min: 332, pp_max: 343});
        const beatmap_info = get_beatmap_info_by_md5(beatmap.md5);
        if (beatmap_info){
            return  {success: formatMap({...beatmap, ...beatmap_info})};
        }

        return {error: '[recomend] > error beatmap id'}
    }
}

const formatMap = ({pps, beatmapsetid, beatmapid, artist, title}) => {
        const ss = pps.find( x => x.acc == 100);

        return [`${artist} - ${title}`,
        `100%=${Math.round(ss.pp.total)}pp`, 
        `aim=${Math.round(ss.pp.aim)}pp`,
        `speed=${Math.round(ss.pp.speed)}pp`,
        `accuracy=${Math.round(ss.pp.accuracy)}pp`,
        `diff=${ss.diff.star.toFixed(2)} ★`,
        `aim=${ss.diff.aim.toFixed(2)} ★`,
        `speed=${ss.diff.speed.toFixed(2)} ★`,
        `https://osu.ppy.sh/beatmapsets/${beatmapsetid}#osu/${beatmapid}`].join(' | ');
    
}