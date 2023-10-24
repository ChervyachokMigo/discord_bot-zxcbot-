const { readFileSync } = require("fs");
const path = require('path');
const { prepareDB, select_mysql_model } = require('../modules/DB/defines.js');


module.exports = async () => {
    console.log('saving beatmaps records from osu.db.json to mysql...');

    const data = JSON.parse(readFileSync(path.join('data','osu_pps','osu.db.json'), { encoding: 'utf8'}));
    const beatmaps = data.beatmaps;

    await prepareDB();
    const beatmap_data = select_mysql_model('beatmap_data');

    let i = 0;

    for (let {beatmap_id, beatmapset_id, title, artist, creator, difficulty, gamemode, ranked_status_int, beatmap_md5} of beatmaps) {
        const new_beatmap = {
            beatmap_id: Number(beatmap_id),
            beatmapset_id: Number(beatmapset_id),
            star_taiko_local: 0, star_taiko_lazer: 0,
            artist, title, creator, difficulty, gamemode,
            ranked: ranked_status_int,
            md5: beatmap_md5
        }

        await beatmap_data.findOrCreate({ 
            where: { md5: beatmap_md5 }, 
            defaults: new_beatmap,
            logging: '', 
            maxExecutionTimeHintMs: 600000
        });

        if (i % 2000 === 0) {
            console.log( (i/beatmaps.length * 100).toFixed(1), '%')
        }
        i++
    }

    console.log('writed', beatmaps.length,'beatmap records to mysql');
    return;
}

