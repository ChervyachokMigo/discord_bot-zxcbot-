const { spawn } = require("child_process")
const path = require("path");
const fs = require("fs");
const keypress = require('keypress');

const { saveError } = require("../modules/logserver");
const { prepareDB } = require("../modules/DB/defines.js");
const { ModsToInt } = require('./osu_mods');
const { MYSQL_SAVE, MYSQL_GET_ALL } = require("../modules/DB/base");
const { MYSQL_GET_ALL_RESULTS_TO_ARRAY } = require("../modules/DB");

const { osu_md5_stock } = require("../settings");

const calc_exe = path.join(__dirname,'../bin/pp_calculator/PerformanceCalculator.exe');

const ranked_status = {
    ranked: 4
}

const maxExecuting = 9;

let calculated_chunck_data = [];

let next_actions = [];
this.current_actions = 0;


let calculated_osu_beatmaps = null;

let started_date = new Date();
let actions_max = null;

const actions = [
    /*{acc: '100', mods: []}, 
    {acc: '99', mods: []}, 
    {acc: '98', mods: []}, 
    {acc: '95', mods: []}*/
    {acc: '100', mods: ['HD']},
    {acc: '99', mods: ['HD']},
    {acc: '98', mods: ['HD']},
   // {acc: '100', mods: ['DT']},
    //{acc: '100', mods: ['HR']},
    /*{acc: '100', mods: ['DT', 'HD']},
    {acc: '100', mods: ['DT', 'HD', 'HR']},
    {acc: '100', mods: ['DT', 'EZ']},
    {acc: '100', mods: ['DT', 'EZ', 'HD']},
    {acc: '100', mods: ['HR', 'HD']},
    {acc: '100', mods: ['HT']},
    {acc: '100', mods: ['HT', 'HD']},
    {acc: '100', mods: ['HT', 'HR']},
    {acc: '100', mods: ['HT', 'HD', 'HR']},
    {acc: '100', mods: ['EZ']},
    {acc: '100', mods: ['HT', 'EZ']},
    {acc: '100', mods: ['HT', 'EZ', 'HD']},
    {acc: '100', mods: ['HT', 'EZ', 'HR']},
    {acc: '100', mods: ['HT', 'EZ', 'HR', 'HD']},*/
];

const save_calculated_data = async () => {
    console.log( 'calc > save to mysql')
    const recorded_calculations = calculated_chunck_data.slice();
    calculated_chunck_data = [];
    await MYSQL_SAVE('osu_beatmap_pp', 0, recorded_calculations);
}

const ActionsController =  async () => {

    if (this.current_actions >= maxExecuting){
        console.log('ActionsController > exit')
        return;
    }

    if (next_actions.length === 0) {
        await save_calculated_data();
        console.log('ended');
        return;
    }

    if (calculated_chunck_data.length > 500 && next_actions.length > 0){
        await save_calculated_data();
    }

    /*if (this.current_actions < 0){
        this.current_actions = 0
    }*/

    while (this.current_actions < maxExecuting){
        let args = next_actions.shift();
        this.current_actions++;
        calcAction (args);
    }


}

const calcAction = ({md5, gamemode = 'osu', acc = '100', mods = []}) => {

    let acc_args = `-a ${acc}`;

    if (gamemode === 'mania'){
        acc_args = `-s ${acc*10000}`
    }

    const proc = spawn( calc_exe, [
        'simulate', 
        gamemode,
        mods.length > 0? mods.map( x => `-m ${x}`).join(' '): '',
        '-j',
        `${path.join(osu_md5_stock, `${md5}.osu`)}`,
        acc_args,
    ], {windowsHide: true});
    


    let result = '';
    let error = '';

    proc.stdout.on('data', (data) => {
        if (data.length > 0){
            result += data;
        }
    })

    proc.stdout.on('close', async () =>{
        if (result.length > 0){
            calc_result_add ({ md5, data: JSON.parse(result), mods });
        }
    });

    proc.stderr.on('data', async (data) => {
        if (data.length > 0){
            error = data.toString();
        }
    });

    proc.stderr.on('close', async () => {
        if (error.length > 0){
            try{
                fs.copyFileSync( path.join(osu_md5_stock, `${md5}.osu`), path.join( __dirname, '..\\data\\osu_pps\\calc_error\\', `${md5}.osu`) )
            } catch (e){
                console.error(e)
            }
            saveError(['beatmaps_pp_calc.js','en.on(calc)',md5, gamemode, acc, error].join(' > '));
            
        }
    });

    proc.on('exit', async () => {
        this.current_actions--;
        await ActionsController();
    });

}

const calc_result_add = ({md5, data, mods})=> {
    const record = {
        md5,
        beatmap_id: data.score.beatmap_id,
        mods: ModsToInt(mods),
        accuracy: Math.round(data.score.accuracy),
        pp_total: Math.round(data.performance_attributes.pp),
        pp_aim: Math.round(data.performance_attributes.aim),
        pp_speed: Math.round(data.performance_attributes.speed),
        pp_accuracy: Math.round(data.performance_attributes.accuracy),
        stars: data.difficulty_attributes.star_rating,
        diff_aim: data.difficulty_attributes.aim_difficulty,
        diff_speed: data.difficulty_attributes.speed_difficulty,
        diff_sliders: data.difficulty_attributes.slider_factor,
        speed_notes: Math.round(data.difficulty_attributes.speed_note_count),
        AR: data.difficulty_attributes.approach_rate,
        OD: data.difficulty_attributes.overall_difficulty,
    }

    calculated_chunck_data.push(record)
}

const calc_from_mysql = async (gamemode = 'osu', ranked = ranked_status.ranked) => {
    await prepareDB();
    
    const beatmaps_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(
        await MYSQL_GET_ALL('beatmap_data', { gamemode, ranked }, ['md5', 'gamemode', 'ranked'] ))
        .sort ( (a, b) => a.md5.localeCompare(b.md5) );
    
    await init_calc(beatmaps_data);

}

const init_key_events = () => {
    keypress(process.stdin);

    process.stdin.on('keypress', (ch, key) => {
        if (key && key.name == 'q' && next_actions.length > 0 && this.current_actions > 0) {
            let completed = actions_max - next_actions.length;
            let last_action_date = new Date();
            let processed_ms = last_action_date - started_date;
            let action_speed = completed / (processed_ms * 0.001);
            console.log('<----------------------------------------------------------------->');
            console.log('Выполнено:\t\t', completed, '/', actions_max);
            console.log('Осталось:\t\t', next_actions.length, '/', actions_max);
            console.log('Скорость:\t\t', action_speed.toFixed(1), 'act/sec');
            console.log('Заверешние через:\t', Math.round(next_actions.length/action_speed/60), 'мин');
        }
        if (key && key.ctrl && key.name == 'c') {
            process.exit(0)
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();
}

const init_calc = async ( beatmaps = [] ) => {
    console.log('calc > loading')

    calculated_osu_beatmaps = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('osu_beatmap_pp' ));
    const calculated_set = new Set( calculated_osu_beatmaps.map( (x) => `${x.md5}:${x.accuracy}:${x.mods}` ));

    console.log('loaded calculated records:', calculated_osu_beatmaps.length)
    console.log('loaded calculated set:', calculated_set.size)

    const actions_with_mods = actions.map( val => { return {...val, mods_int: ModsToInt(val.mods)} });

    console.log('checking beatmaps', beatmaps.length);

    for (let beatmap of beatmaps){
        if (beatmap.ranked !== 4 || beatmap.gamemode !== 'osu'){
            console.log('skip >', beatmap.md5)
            continue;
        }

        for (let action of actions_with_mods){
            let args = {...beatmap, ...action};

            if (calculated_set.has( `${args.md5}:${args.acc}:${args.mods_int}`) === false) {
                next_actions.push( args );
            }
        }
    }

    console.log('added actions:', next_actions.length);

    actions_max = next_actions.length;

    console.log('start calcing..');

    init_key_events();

    if (this.current_actions < maxExecuting){
        await ActionsController();
    }
}

module.exports = {
    init_calc: init_calc,
    calc_from_mysql: calc_from_mysql
}

