
const { default: axios } = require('axios');
const crypto = require('crypto');
const { writeFileSync } = require('fs');
const path = require('path');
const { osu_md5_stock } = require('../settings');
const { get_beatmap_id } = require('../modules/DB/beatmaps');

const download_beatmap_content = async ({ beatmap_id, md5 }, output_path, is_md5_check = true) => {
    if (!output_path){
        throw 'set beatmap output path'
    }

    return new Promise( async (res) => {
        const url = `https://osu.ppy.sh/osu/${beatmap_id}`;
        await axios.get( url ).then( async (response) => {
            if (response && response.data && response.data.length > 0) {
                const downloaded_md5 = crypto.createHash('md5').update(response.data).digest("hex");
                
                writeFileSync( path.join( output_path, `${downloaded_md5}.osu` ), response.data);

                if (is_md5_check && downloaded_md5 === md5 || !is_md5_check){
                    res({ data: response.data });
                } else {
                    res({ error: `[${md5}] > beatmap md5 not valid` });
                }
            } else {
                res({ error: `[${md5}] > no response from bancho` });
            }
        }).catch( err => {
            res({ error: `[${md5}] > ${err.toString()}` });
        });
    });

}

module.exports = {
    download_by_md5_list: async ( maps ) => {
        let results = [];

        for (let md5 of maps){

            const { beatmap_id } = await get_beatmap_id({ md5 });

            if (beatmap_id) {
                const result = await download_beatmap_content({ beatmap_id, md5 }, osu_md5_stock );

                if (result.data) {
                    results.push({md5, data: result.data});
                } else {
                    results.push({md5, error: result.error});
                }
            }
        }

        return results;
    }
}
