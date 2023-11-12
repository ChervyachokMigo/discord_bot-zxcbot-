const { readdirSync } = require("fs");
const { load_csv } = require("../../osu_pps/backup/mysql_import");
const splitArray = require("../../osu_pps/tools/splitArray");
const { select_mysql_model, osu_beatmaps_mysql } = require("./defines");
const path = require("path");
const { Op, default: Sequelize, Attribute } = require("@sequelize/core");

const GetGamemodeToInt = (mode) => {
    switch (mode) {
        case 'osu':
        case 'std': 
            return 0;
        case 'taiko':
            return 1;
        case 'catch':
        case 'fruits':
        case 'ctb':
            return 2;
        case 'mania':
            return 3;
        default:
            return null;
    }
}

const osu_beatmap_id = select_mysql_model('beatmap_id');
const osu_beatmap_pp = select_mysql_model('osu_beatmap_pp');
const beatmaps_md5 = select_mysql_model('beatmaps_md5');
const osu_beatmap_info = select_mysql_model('beatmap_info');

let beatmaps_md5_cache = null;

const init_md5_cache = async () => {
    
    //await import_md5_csv ('data\\osu_pps\\mysql_backups\\beatmap_data.csv');
    beatmaps_md5_cache = await beatmaps_md5.findAll({ raw: true, logging: false });

    //await import_beatmap_info_csv ('data\\osu_pps\\mysql_backups\\beatmap_data.csv');
    //await import_beatmap_ids_csv ('data\\osu_pps\\mysql_backups\\beatmap_data.csv');
    //await import_beatmap_pps_csv('data\\osu_pps\\mysql_backups\\2023-9-30-12-8-59');

    //console.log(await get_beatmap_pp({mode:0, gamemode:0, accuracy: 100}))
}

const get_beatmap_id = async ({ md5 }) => {
    return await osu_beatmap_id.findOne({
        
        include: [{ model: beatmaps_md5, 
            where: { hash: md5 }
        }],

        
        fieldMap: {
            'beatmaps_md5.hash': 'md5',
            'beatmaps_md5.id': 'md5_int',
        },

        logging: false,
        raw: true, 
    });
}

const import_md5_csv = async (filepath) => {
    const csv_data = load_csv(filepath);

    for (let chunk of splitArray( csv_data, 500) ){
        let data = [];

        for (let value of chunk){
            if (typeof value.md5 === 'string' && value.md5.length === 32){
                data.push({ hash: value.md5 });
            }
        }

        await beatmaps_md5.bulkCreate(data, { logging: false, ignoreDuplicates: true });
    }
}

const get_beatmap_pps_by_id = async ({ beatmap_id, beatmapset_id, gamemode = 0, mods = 0, ranked = 4 }) => {
    if (typeof beatmap_id !== 'number' && typeof beatmapset_id !== 'number' && 
    beatmap_id > 0 && beatmapset_id > 0 ){
        return null;
    }
    
    return await osu_beatmap_pp.findAll({
        where: { mods },

        include: [beatmaps_md5, 
            { model: osu_beatmap_id, where: { beatmap_id, beatmapset_id, gamemode, ranked } },
            osu_beatmap_info
        ],

        
        fieldMap: {
            'beatmaps_md5.hash': 'md5',

            'beatmaps_md5.id': 'md5_int',
            'beatmap_id.md5': 'md5_int',
            'beatmap_info.md5': 'md5_int',

            'beatmap_id.beatmap_id': 'beatmap_id',
            'beatmap_id.beatmapset_id': 'beatmapset_id',
            'beatmap_id.gamemode': 'gamemode',
            'beatmap_id.ranked': 'ranked',

            'beatmap_info.artist': 'artist',
            'beatmap_info.title': 'title',
            'beatmap_info.creator': 'creator',
            'beatmap_info.difficulty': 'difficulty',
        },

        logging: false,
        raw: true, 
    });
}

const find_beatmap_pps = async ({ accuracy = 100, gamemode = 0, mods = 0, ranked = 4, pp_min = 0, pp_max = 0, aim = null, speed = null }) => {

    let aim_condition = {};
    let speed_condition = {};

    if(aim){
        aim_condition = {
            pp_aim:{
                 [Op.gte]: osu_beatmaps_mysql.literal(`pp_speed * ${aim}`)
            }
        }
    }

    if(speed){
        speed_condition = {
            pp_speed:{
                [Op.gte]: osu_beatmaps_mysql.literal(`pp_aim * ${speed}`)
            }
        }
    }

    return await osu_beatmap_pp.findAll({
        where: { 
            accuracy, 
            mods,
            pp_total: { 
                [Op.gte]: pp_min, 
                [Op.lte]: pp_max
            },
            ...aim_condition,
            ...speed_condition
        },

        include: [beatmaps_md5, 
            { model: osu_beatmap_id, where: { gamemode, ranked } },
            osu_beatmap_info
        ],

        
        fieldMap: {
            'beatmaps_md5.hash': 'md5',

            'beatmaps_md5.id': 'md5_int',
            'beatmap_id.md5': 'md5_int',
            'beatmap_info.md5': 'md5_int',

            'beatmap_id.beatmap_id': 'beatmap_id',
            'beatmap_id.beatmapset_id': 'beatmapset_id',
            'beatmap_id.gamemode': 'gamemode',
            'beatmap_id.ranked': 'ranked',

            'beatmap_info.artist': 'artist',
            'beatmap_info.title': 'title',
            'beatmap_info.creator': 'creator',
            'beatmap_info.difficulty': 'difficulty',
        },

        logging: false,
        raw: true, 
    });
}

const get_md5_id = async (hash, returning = true) => {
    if (typeof hash !== 'string' && hash.length !== 32){
        return null;
    }

    const cache_result = beatmaps_md5_cache.find( x => x.md5 === hash);
    if (typeof cache_result !== 'undefined'){
        return cache_result;
    }

    const result = await beatmaps_md5.findOrCreate({ 
        where: { hash },
        logging: false
    });
    if (result[1] === true) {
        beatmaps_md5_cache.push(result[0].dataValues);
    }
    if (returning){
        return result[0].getDataValue('id');
    }

    return null;
}

const remove_beatmap = async (hash) => {
    await beatmaps_md5.destroy({ where: {hash}, logging: false});
}

const import_beatmap_info_csv = async (filepath) => {
    const csv_data = load_csv(filepath);

    console.log('loaded', csv_data.length, 'records from', filepath);
    let est = csv_data.length;

    for (let chunk of splitArray( csv_data, 500) ){
        let new_chunk = [];
        for (let value of chunk){
            if (typeof value.md5 === 'string' && value.md5.length === 32){
                const md5_id = await get_md5_id(value.md5);
                if (md5_id === null){
                    continue;
                }
                new_chunk.push ({
                    md5: md5_id,
                    artist: typeof value.artist !=='string'? value.artist.toString(): value.artist,
                    title: typeof value.title !=='string'? value.title.toString(): value.title,
                    creator: typeof value.creator !=='string'? value.creator.toString(): value.creator,
                    difficulty:typeof value.difficulty !=='string'?  value.difficulty.toString(): value.difficulty
                });
            }
        }
        if (new_chunk.length > 0){
            await osu_beatmap_info.bulkCreate( new_chunk, {
                logging: false, 
                returning: false, 
                ignoreDuplicates: true,
                include: [beatmaps_md5],
            });
            est -= new_chunk.length;
            console.log('saved', new_chunk.length, '/', est, 'records');
        }
    }
}

const import_beatmap_ids_csv = async (filepath) => {
    const csv_data = load_csv(filepath);

    console.log('loaded', csv_data.length, 'records from', filepath);

    let est = csv_data.length;

    for (let chunk of splitArray( csv_data, 500) ){
        let new_chunk = [];
        for (let value of chunk){
            if (typeof value.md5 === 'string' && value.md5.length === 32){
                const md5_id = await get_md5_id(value.md5);
                if (md5_id === null){
                    continue;
                }
                new_chunk.push ({
                    md5: md5_id,
                    beatmap_id: value.beatmap_id,
                    beatmapset_id: value.beatmapset_id,
                    gamemode: GetGamemodeToInt(value.gamemode),
                    ranked: value.ranked
                });
            }
        }
        if (new_chunk.length > 0){
            await osu_beatmap_id.bulkCreate( new_chunk, {
                logging: false, 
                returning: false, 
                ignoreDuplicates: true,
                include: [beatmaps_md5],
            });
            est -= new_chunk.length;
            console.log('saved', new_chunk.length, '/', est, 'records');
        }
    }
}

const import_beatmap_pps_csv = async (csv_dir) => {

    const files = readdirSync(csv_dir)

    for (let filename of files){
        const csv_data = load_csv(path.join(csv_dir, filename));

        console.log('loaded',csv_data.length,'records from',filename);

        let est = csv_data.length;

        for (let chunk of splitArray( csv_data, 500) ){
            let new_chunk = [];
            for (let value of chunk){
                if (typeof value.md5 === 'string' && value.md5.length === 32){
                    const md5_id = await get_md5_id(value.md5);
                    if (md5_id === null){
                        continue;
                    }
                    
                    new_chunk.push ({
                        md5: md5_id,
                        mods: value.mods,
                        accuracy: value.accuracy,
                        pp_total: value.pp_total,
                        pp_aim: value.pp_aim,
                        pp_speed: value.pp_speed,
                        pp_accuracy: value.pp_accuracy,
                        stars: value.stars,
                        diff_aim: value.diff_aim,
                        diff_speed: value.diff_speed,
                        diff_sliders: value.diff_sliders,
                        speed_notes: value.speed_notes,
                        AR: value.AR,
                        OD: value.OD
                    });
                    
                }
            }
            if (new_chunk.length > 0){
                await osu_beatmap_pp.bulkCreate( new_chunk, {
                    logging: false, 
                    returning: false, 
                    ignoreDuplicates: true,
                    include: [beatmaps_md5],
                });
                est -= new_chunk.length;
                console.log('saved', new_chunk.length, '/', est, 'records');
            }
        }
    }
}

const beatmap_pp_keys = ['md5', 'mods', 'accuracy', 'pp_total', 'pp_aim', 'pp_speed', 'pp_accuracy', 
    'stars', 'diff_aim', 'diff_speed', 'diff_sliders', 'speed_notes', 'AR', 'OD'];

const beatmap_pp_id_keys = ['md5', 'gamemode', 'ranked', 'beatmap_id', 'beatmapset_id'];

const get_beatmap_pp = async (condition = {} ) => {

    const beatmap_pp_conditions = Object.entries( condition ).filter( x => beatmap_pp_keys.indexOf(x[0]) > - 1)
    .reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {}) ;

    const beatmap_id_conditions = Object.entries( condition ).filter( x => beatmap_pp_id_keys.indexOf(x[0]) > - 1)
    .reduce((a, v) => ({ ...a, [v[0]]: v[1]}), {}) ;

    return await osu_beatmap_pp.findAll({
        where: beatmap_pp_conditions,
        
        include: [beatmaps_md5, {
            model: osu_beatmap_id,
            where: beatmap_id_conditions
        }], 

        fieldMap: {
            'beatmaps_md5.hash': 'md5',
            'beatmap_id.md5': 'md5_int',
            'beatmap_id.beatmap_id': 'beatmap_id',
            'beatmap_id.beatmapset_id': 'beatmapset_id',
            'beatmap_id.gamemode': 'gamemode',
            'beatmap_id.ranked': 'ranked',
        },

        logging: false,
        raw: true, 
    });

}

module.exports = {
    init_md5_cache,
    get_md5_id,
    remove_beatmap,
    get_beatmap_pps_by_id,
    find_beatmap_pps,
    get_beatmap_id,
    GetGamemodeToInt
}