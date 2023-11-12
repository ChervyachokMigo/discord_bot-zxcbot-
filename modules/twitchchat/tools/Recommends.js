
const { ModsToInt } = require("../../../osu_pps/osu_mods");
const { find_beatmap_pps } = require("../../DB/beatmaps");

this.founded_buffer = [];

const shuffle = (i) => {
    //this.founded_buffer[i].maps.sort( () => (Math.random() > .5));
    for (let k = 0; k < this.founded_buffer[i].maps.length; k++) {
        let j = Math.floor(Math.random() * (k + 1));
        [this.founded_buffer[i].maps[k], this.founded_buffer[i].maps[j]] = [this.founded_buffer[i].maps[j], this.founded_buffer[i].maps[k]];
    }
}

const find = async ({username, acc = 100, pp_min, pp_max, aim, speed}) => {
    let i = this.founded_buffer.findIndex( x => 
        x.username === username && 
        x.acc === acc && 
        x.pp_min === pp_min && 
        x.pp_max === pp_max && 
        x.aim === aim &&
        x.speed === speed );
    
    if ( i === -1 ) {

        const find_condition = { 
            mods: ModsToInt([]), 
            accuracy: acc, 
            pp_min,
            pp_max,
            aim,
            speed
        };

        let maps = await find_beatmap_pps(find_condition);

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
            speed,
            maps
        }) - 1;
    }

    shuffle(i);

    const founded_map = this.founded_buffer[i].maps.shift();

    if (!founded_map) {
        return null;
    }

    return founded_map;
}

module.exports = {
    find
}
