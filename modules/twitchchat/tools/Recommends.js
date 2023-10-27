const { readFileSync } = require("fs");
const { log } = require("../../../tools/log");
const { MYSQL_GET_ALL, MYSQL_GET_ONE } = require("../../DB/base");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../tools");
const { MYSQL_GET_ALL_RESULTS_TO_ARRAY } = require("../../DB");
const { Op } = require("@sequelize/core");
const { ModsToInt } = require("../../../osu_pps/osu_mods");

this.data = null;

this.founded_buffer = [];

const get_beatmap_info_localy = async (args) => {
    const result = await MYSQL_GET_ONE( 'beatmap_data', args );
    if (result) {
        return result.dataValues;
    }
    return null;
}

const shuffle = (i) => {
    //this.founded_buffer[i].maps.sort( () => (Math.random() > .5));
    for (let k = 0; k < this.founded_buffer[i].maps.length; k++) {
        let j = Math.floor(Math.random() * (k + 1));
        [this.founded_buffer[i].maps[k], this.founded_buffer[i].maps[j]] = [this.founded_buffer[i].maps[j], this.founded_buffer[i].maps[k]];
    }
}

module.exports = {
    init: async () => {
        log('load recommends maps', 'osu recomends');
        this.data = JSON.parse(readFileSync('md5_pps_osu.json', { encoding: 'utf8'}));
        const mysql_data = new Set( GET_VALUES_FROM_OBJECT_BY_KEY( MYSQL_GET_ALL_RESULTS_TO_ARRAY( 
            await MYSQL_GET_ALL('beatmap_data', {gamemode: 'osu', ranked: 4 })), 'md5'));
        
        this.data = this.data.filter ( x => mysql_data.has(x.md5) === true );
    },

    find: async ({username, acc = 100, pp_min, pp_max, aim}) => {
        let i = this.founded_buffer.findIndex( x => 
            x.username === username && 
            x.acc === acc && 
            x.pp_min === pp_min && 
            x.pp_max === pp_max && 
            x.aim === aim );
        
        if ( i === -1 ) {

            const find_condition = { 
                mods: ModsToInt([]), 
                accuracy: acc, 
                pp_total: { 
                    [Op.gte]: pp_min, 
                    [Op.lte]: pp_max 
            }};

            let maps = MYSQL_GET_ALL_RESULTS_TO_ARRAY( 
                await MYSQL_GET_ALL('osu_beatmap_pp', find_condition ));

            //поиск по аиму y.diff.aim > y.diff.speed * aim

            if (!maps || maps.length === 0) {
                return null;
            }

            i = this.founded_buffer.push({
                username,
                acc,
                pp_min,
                pp_max,
                aim,
                maps
            }) - 1;
        }

        shuffle(i);

        const founded_map = this.founded_buffer[i].maps.shift();
        const beatmap_info = await get_beatmap_info_localy({ md5: founded_map.md5 });

        if (!beatmap_info) {
            return null;
        }

        return {...founded_map, ...beatmap_info};
    },

    get_beatmap_info_localy: get_beatmap_info_localy,
}
