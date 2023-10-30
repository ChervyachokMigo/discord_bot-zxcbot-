const path = require("path");

const { MYSQL_GET_ALL } = require("../../modules/DB/base.js");

const { prepareDB } = require("../../modules/DB/defines.js");
const actions = require("../consts/actions.js");
const { ModsToInt } = require("../osu_mods.js");
const { writeFileSync, readdirSync } = require("fs");
const { spawnSync } = require("child_process");

const backup_path = path.join(__dirname, '../../data/osu_pps/mysql_backups');

const export_csv = async () => {
    await prepareDB();

    for (let {acc, mods} of actions){
        
        const mods_int = ModsToInt(mods);

        console.log('exporting >', 'osu_beatmap_pp','acc:', acc, 'mods:', mods_int);

        const mysql_values = await MYSQL_GET_ALL( 'osu_beatmap_pp', { mods: mods_int, accuracy: Number(acc) });
        
        if (mysql_values.length>0){
            let data = [];
            data.push( Object.keys(mysql_values[0]).map( x => `"${x}"` ).join(';') );
            for (let record of mysql_values){
                data.push( Object.values(record).map( x => typeof x === 'string'? `"${x}"` : x ).join(';') );
            }
            const filepath = `osu_beatmap_pp_${acc}_${mods_int}.csv`;
            writeFileSync(path.join( backup_path, filepath), data.join('\r\n'), {encoding: 'utf8'});

        }
        
    }

    console.log('export complete.');

}

const pack = async () => {
    console.log('creating archive csv files');

    const now = new Date()

    const filename =  `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.7z`;
    var command = '7z/7za.exe';
    var args2 = [ 
        'a',
        '-y',
        '-mx9',
        path.join(backup_path, filename),
        `${path.join(backup_path, '\\', '*.csv')}`
    ];
    const {stdout, stderr} = spawnSync(command, args2, {encoding: 'utf8'});

    console.log(stdout, stderr)
}

module.exports = {
    export_csv,
    pack,
}
