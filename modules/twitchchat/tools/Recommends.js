const { readFileSync } = require("fs");
const { log } = require("../../../tools/log");

this.data = null;

module.exports = {
    init: () => {
        log('load recommends maps', 'osu recomends');
        this.data = JSON.parse(readFileSync('md5_pps_osu.json', { encoding: 'utf8'}));
    },

    find: ({acc, pp_min, pp_max}) => {
        const founded = this.data.filter(x => x.pps.find( y => y.acc === acc && y.pp.total >= pp_min && y.pp.total <= pp_max) );
        return founded[Math.floor(Math.random()*founded.length)];
    }
}