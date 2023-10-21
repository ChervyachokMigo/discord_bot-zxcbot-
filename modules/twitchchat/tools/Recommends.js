const { readFileSync } = require("fs");
const { log } = require("../../../tools/log");
const { MYSQL_GET_ALL } = require("../../DB/base");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("../../tools");
const { MYSQL_GET_ALL_RESULTS_TO_ARRAY } = require("../../DB");

this.data = null;

this.founded_buffer = [];

module.exports = {
    init: async () => {
        log('load recommends maps', 'osu recomends');
        this.data = JSON.parse(readFileSync('md5_pps_osu.json', { encoding: 'utf8'}));
        const mysql_data = new Set( GET_VALUES_FROM_OBJECT_BY_KEY( MYSQL_GET_ALL_RESULTS_TO_ARRAY( 
            await MYSQL_GET_ALL('beatmap_data', {gamemode: 'osu', ranked: 4 })), 'md5'));
        
        this.data = this.data.filter ( x => mysql_data.has(x.md5) === true );
    },

    find: ({username, acc, pp_min, pp_max, aim}) => {
        let i = this.founded_buffer.findIndex( x => 
            x.username === username && 
            x.acc === acc && 
            x.pp_min === pp_min && 
            x.pp_max === pp_max && 
            x.aim === aim );

        
        if ( i > -1 ) {
            
            shuffle(i);
        } else {
            let maps = null;

            if (aim) {
                maps = this.data.filter(x => x.pps.find( y => y.acc === acc && y.pp.total >= pp_min && y.pp.total <= pp_max &&
                    y.diff.aim > y.diff.speed * aim) );
            } else {
                maps = this.data.filter(x => x.pps.find( y => y.acc === acc && y.pp.total >= pp_min && y.pp.total <= pp_max) );
            }

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


        const founded_map = this.founded_buffer[i].maps.shift();

        return founded_map;
    }
}

const shuffle = (i) => {
    //this.founded_buffer[i].maps.sort( () => (Math.random() > .5));
    for (let k = 0; k < this.founded_buffer[i].maps.length; k++) {
        let j = Math.floor(Math.random() * (k + 1));
        [this.founded_buffer[i].maps[k], this.founded_buffer[i].maps[j]] = [this.founded_buffer[i].maps[j], this.founded_buffer[i].maps[k]];
    }
}