const { spawnSync } = require('child_process');
const { formatAddZero } = require('../../../tools/time.js');
const { MYSQL_GET_IGNORE_TWITCH_CHATS, GET_TWITCH_OSU_BIND } = require('../../DB.js');
const { getBeatmapInfoByUrl } = require('../../stalker/osu.js');
const { ALL } = require('../constants/enumPermissions.js');
const { irc_say } = require('../tools/ircManager.js');
const { default: axios } = require('axios');
const crypto = require('crypto');
const fs = require("fs");
const { saveError } = require('../../logserver/index.js');
const path = require('path');

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
        //https://osu.ppy.sh/osu/1915983


        let info = beatmap_info.success;

        if (!info.pps || info.pps && info.pps.length === 0) {
            const result = await get_not_existed_beatmap(info);
            if (result.error) {
                console.error(result.error);
            } else {

                info.pps = result.pps.map ( calc_info => { return {
                    acc: Math.floor(calc_info.score.accuracy),
                    pp: Math.floor(calc_info.performance_attributes.pp)
                }});
                
            }
        }

        //Send info

        const osu_bind = await GET_TWITCH_OSU_BIND(tags['user-id']);

        if (osu_bind) {
            irc_say(osu_bind.osu_name, formatBeatmapInfoOsu(tags.username, info) );
        }

        return  {success: formatBeatmapInfoTwitch(info)}
    }
}

const md5_stock = 'D:\\osu_md5_stock';

const get_not_existed_beatmap = async (info) => {
    
    return new Promise( async (res) => {
        const url = `https://osu.ppy.sh/${info.beatmapset_mode}/${info.id}`;
        await axios.get( url ).then( response => {
            if (response && response.data) {
                const md5_string = crypto.createHash('md5').update(response.data).digest("hex");
                if (md5_string === info.md5){
                    fs.writeFileSync(path.join(md5_stock,`${md5_string}.osu`), response.data);
                    res({ pps: calc_diffs({ md5_name: md5_string, mode: info.mode }) });
                } else {
                    res({ error: 'beatmap md5 not valid' });
                }
            } else {
                res({ error: 'no response from bancho' });
            }
        }).catch( err => {
            res({ error: err.toString() });
        });
    });

}

const calc_exe = path.join(__dirname,'../../../bin/pp_calculator/PerformanceCalculator.exe');

const actions = [
    {acc: '100'}, 
    {acc: '99'}, 
    {acc: '98'}, 
    {acc: '95'}
]

const calc_acc = ({md5_name, mode, acc}) => {
    let acc_args = `-a ${acc}`;

    if (mode === 'mania'){
        acc_args = `-s ${acc*10000}`
    }

    const { stdout, stderr } = spawnSync( calc_exe, [
        'simulate', 
        mode, 
        '-j',
        `${path.join(md5_stock, `${md5_name}.osu`)}`,
        acc_args,
    ]);

    if (stderr.length > 0) {
        console.error(md5_name, mode, acc);
        console.log(stderr.toString());
        saveError(['beatmaps_info.js','calc_acc',md5_name, mode, acc, stderr.toString()].join(' > '));
        throw 'error';
    }

    return JSON.parse(stdout);

}
const output_path = '.\\data\\beatmaps_data\\';

const calc_diffs = (args) => {
    
    const results = actions.map( val => calc_acc( {...args, ...val} ));

    if (results.length === actions.length){
        fs.writeFileSync(path.join(output_path, `${args.md5_name}.json`), JSON.stringify( results.map( val => val ) ), { encoding: 'utf8' });
        return results;
    };

}

const formatBeatmapInfoOsu = (username, info) => {
    const url = `[${info.url} ${info.artist} - ${info.title} [${info.diff}] by ${info.creator}] >`;
    const pp = info.pps.length > 0 ? info.pps.map( val => `${val.acc}% > ${val.pp}pp`).join(' | '): '';
    const text = [
        info.status,
        `${info.stars} ★`,
        `${info.bpm} BPM`,
        `${info.max_combo}x`,
        `${formatAddZero(Math.trunc(info.length / 60), 2)}:${formatAddZero(info.length % 60, 2)}`,
        pp
    ];
    return `${username} > ${url} ${text.join(' | ')}`;
}

const formatBeatmapInfoTwitch = (info) => {
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
        `HP: ${info.hp}`,
        info.pps.length > 0 ? info.pps.map( val => `${val.acc}%=${val.pp}pp`).join(' ▸'): 'no calc pp'
    ].join(' ▸');
}
