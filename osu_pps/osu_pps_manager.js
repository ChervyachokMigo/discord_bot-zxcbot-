

//generate data/osu_pps/osu.db.json
const make_osu_db_json = require("./make_osu_db_json.js");
const save_osu_db_json_to_mysql = require('./beatmaps_db_full_from_osu_db_json.js');

//const unused_get_pps_data_osu = require('./get_pps_data_osu.js')

const { make_beatmaps_db, md5_stock_compare } = require('./beatmaps_md5_stock.js');
const { calc_from_mysql } = require("./beatmaps_pp_calc.js");

const get_beatmap_by_md5 = require('./get_beatmap_by_md5');
const { export_osu_beatmap_pp_csv, pack, export_any_table_csv } = require('./backup/mysql_export.js');

const main = async () => {
    //await calc_from_mysql('osu', 4, true);
    //await export_osu_beatmap_pp_csv()
    //await pack()
    //await export_any_table_csv('beatmap_data')
}

main();