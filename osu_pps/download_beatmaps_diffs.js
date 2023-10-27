const get_beatmap_by_md5 = require('./get_beatmap_by_md5');

const {get_beatmap_info_localy} = require('../modules/twitchchat/tools/Recommends');
const { default: axios } = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { osu_md5_stock } = require('../settings');
const { MYSQL_DELETE } = require('../modules/DB/base');

const get_not_existed_beatmap = async (info, output_path) => {
    if (!output_path){
        throw 'set beatmap output path'
    }
    return new Promise( async (res) => {
        const url = `https://osu.ppy.sh/osu/${info.id}`;
        await axios.get( url ).then( async (response) => {
            if (response && response.data) {
                const md5 = crypto.createHash('md5').update(response.data).digest("hex");
                
                fs.writeFileSync( path.join( output_path, `${md5}.osu` ), response.data);

                if (md5 === info.md5){
                    res({ data: response.data });
                } else {
                    await MYSQL_DELETE('beatmap_data', { md5: info.md5});
                    res({ error: `[${info.md5}] > beatmap md5 not valid` });
                }
            } else {
                res({ error: `[${info.md5}] > no response from bancho` });
            }
        }).catch( err => {
            res({ error: `[${info.md5}] > ${err.toString()}` });
        });
    });

}

module.exports = {
    download_by_md5_list: async ( maps ) => {
        let results = [];

        for (let md5 of maps){

            const val = await get_beatmap_info_localy( {md5} );

            if (val) {
                const result = await get_not_existed_beatmap( {id: val.beatmap_id, md5 }, osu_md5_stock );

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
