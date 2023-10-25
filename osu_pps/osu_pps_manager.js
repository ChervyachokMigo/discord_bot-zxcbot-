//generate data/osu_pps/osu.db.json
const make_osu_db_json = require("./make_osu_db_json.js");
const save_osu_db_json_to_mysql = require('./beatmaps_db_full_from_osu_db_json.js');

//const unused_get_pps_data_osu = require('./get_pps_data_osu.js')

const { make_beatmaps_db, md5_stock_compare } = require('./beatmaps_md5_stock.js');
const { calc_from_mysql } = require("./beatmaps_pp_calc.js");

const main = async () => {
    await calc_from_mysql('osu', 4, true)
}

main();