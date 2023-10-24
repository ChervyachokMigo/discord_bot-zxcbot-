const { md5_stock_compare } = require("../osu_pps/beatmaps_md5_stock");
const { calc_from_mysql } = require("../osu_pps/beatmaps_pp_calc");
const { log } = require("../tools/log");

const moduleName = 'Beatmaps db';

module.exports = {
    init: async () => {
        log('comparing stock', moduleName)
        md5_stock_compare();
        log('calculate pp', moduleName)
        await calc_from_mysql('osu', 4);
    }


}