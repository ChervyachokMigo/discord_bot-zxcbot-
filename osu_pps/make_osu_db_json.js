const {osu_db_load, beatmap_property } = require('osu_tools');

const path = require('path');
const { writeFileSync } = require('fs');

const {osuPath} = require('../settings.js');

const osu_db_path = path.join(osuPath, 'osu!.db')
const output_dest = path.join('data', 'osu_pps','osu.db.json');

const beatmap_props = [
    beatmap_property.beatmap_md5,
    beatmap_property.beatmap_id,
    beatmap_property.beatmapset_id,
    beatmap_property.artist,
    beatmap_property.title,
    beatmap_property.creator,
    beatmap_property.difficulty,
    beatmap_property.gamemode,
    beatmap_property.ranked_status
];

module.exports = () => {
    console.log('parsing osu.db...');
    const results = osu_db_load( osu_db_path, beatmap_props );
    writeFileSync( output_dest, JSON.stringify(results), {encoding: 'utf8'});
    console.log('writed', results.beatmaps.length,'beatmap records');
}

