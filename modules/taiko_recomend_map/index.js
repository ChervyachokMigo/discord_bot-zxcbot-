const  fs = require('fs');
const {  log } = require("../../tools/log.js");

var farming_maps;

function get_random_beatmap(stars_min = 0, stars_max = 10, strength_min = -99, strength_max = 99){
    var finded_maps = farming_maps.filter(val=> {
        return val.beatmap_star_local > stars_min && val.beatmap_star_local < stars_max &&
            val.star_difference > strength_min && val.star_difference < strength_max
    });
    if (finded_maps.length>0){
        return finded_maps[Math.trunc(Math.random()*finded_maps.length)];
    } else {
        return false;
    }
}


function load_farming_maps(){
    farming_maps = JSON.parse(fs.readFileSync('farming_maps.json'));
}

async function initialize(){
    log('Загрузка карт для тайко', 'taiko_farming_maps');
    load_farming_maps();
    //read_farming_maps(4.3, 5.2, 0.2); //test
}

exports.taiko_farming_maps_initialize = initialize;
exports.taiko_farming_maps_get_random_beatmap = get_random_beatmap;