const { spawn, execSync, exec } = require("child_process")
const path = require("path");
const fs = require("fs");
const keypress = require('keypress');
const { cpuUsage } = require('os-utils');

const { saveError } = require("../modules/logserver");
const { prepareDB } = require("../modules/DB/defines.js");
const { ModsToInt } = require('./osu_mods');
const { MYSQL_SAVE, MYSQL_GET_ALL } = require("../modules/DB/base");

const { osu_md5_stock } = require("../settings");
const { download_by_md5_list } = require("./download_beatmaps_diffs");
const actions = require("./consts/actions");

const calc_exe = path.join(__dirname,'../bin/pp_calculator/PerformanceCalculator.exe');

const ranked_status = {
    ranked: 4
}

const setting_MaxExecuting = 10;
const setting_StartExecuting = 6;

let maxExecuting = setting_StartExecuting;
const mysql_chunk_size = 500;

let calculated_chunck_data = [];

let next_actions = [];
this.current_actions = 0;

this.toggle_explorer = true;

let beatmaps_failed = [];

let calculated_osu_beatmaps = null;
let actions_max = null;
let started_date = null;
let ended_count = null;

const cpu_usage = async () => {
    return new Promise ( res => {
        cpuUsage( (v) => {
            res (v * 100);
        });
    });
}


const kill_process = (appName) => {
    execSync(`taskkill /im ${appName} /F`);
}

const save_calculated_data = async () => {
    const recorded_calculations = calculated_chunck_data.slice();
    calculated_chunck_data = [];
    if (recorded_calculations.length > 0){
        console.log( 'calc > save to mysql >',recorded_calculations.length ,'records')
        await MYSQL_SAVE('osu_beatmap_pp', 0, recorded_calculations);
    }
}

const ActionsController =  async () => {

    if (this.current_actions >= maxExecuting){
        return;
    }

    if (next_actions.length === 0) {
        if (!ended_count){
            ended_count = this.current_actions;
        }
        if (ended_count){
            ended_count = ended_count - 1;
        }
        await save_calculated_data();
        return;
    }

    if (calculated_chunck_data.length > mysql_chunk_size && next_actions.length > 0){
        await save_calculated_data();
    }

    while (this.current_actions < maxExecuting){
        let args = next_actions.shift();
        if (args){
            this.current_actions++;
            calcAction (args);
        } else {
            break;
        }
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
        ...mods.length > 0? mods.map( x => `-m ${x}`): '-m CL',
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
            try{
                let data = JSON.parse(result);
                calc_result_add ({ md5, data, mods });
            } catch (e){
                saveError(['beatmaps_pp_calc.js','std out (close)', md5, gamemode, acc, proc.spawnargs.join(' '), error].join(' > '));
                console.error(`calc > error > something wrong with beatmap ${md5}.osu`);
            }

        }
    });

    proc.stderr.on('data', async (data) => {
        if (data.length > 0){
            error = data.toString();
        }
    });

    proc.stderr.on('close', async () => {
        if (error.length > 0){
            /*try{
                fs.copyFileSync( path.join(osu_md5_stock, `${md5}.osu`), path.join( __dirname, '..\\data\\osu_pps\\calc_error\\', `${md5}.osu`) )
            } catch (e){
                console.error(`calc > error > can not copy ${md5}.osu`)
            }*/
            beatmaps_failed.push(md5);

            saveError(['beatmaps_pp_calc.js','std err (close)', md5, gamemode, acc, error].join(' > '));

            
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

const calc_from_mysql = async (gamemode = 'osu', ranked = ranked_status.ranked, is_key_events = false) => {
    await prepareDB();
    
    const beatmaps_data = (await MYSQL_GET_ALL('beatmap_data', { gamemode, ranked }, ['md5', 'gamemode', 'ranked'] ))
        .sort ( (a, b) => a.md5.localeCompare(b.md5) );

    if (is_key_events){
        init_key_events();
    }

    for (let action_args of actions){
        const is_done = await init_calc_action(beatmaps_data, action_args);
        console.log(`calc complete > ${action_args.acc}% ${action_args.mods.join('+')}`);

        let beatmaps_results = await download_by_md5_list(beatmaps_failed);
        for (let {error, data, md5} of beatmaps_results){
            if (error){
                console.log(error);
                continue;
            }
            if (data){
                fs.writeFileSync(path.join(osu_md5_stock, `${md5}.osu`), data, {encoding: 'utf8'});
                console.log(`saved ${md5}.osu > ${data.length} bytes`);
            }
        }
        beatmaps_failed = [];
    }

}

const init_key_events = () => {

    keypress(process.stdin);

    console.log('<----------------------------------------------------------------->');
    console.log('*** CONTROL KEYS ***');
    console.log('Q\tPROCESS INFO');
    console.log('A\tDECREASE PROCESSES');
    console.log('S\tINCREASE PROCESSES');
    console.log('P\tPAUSE/RESUME');
    console.log('CTRL + C\tEXIT');
    console.log('<----------------------------------------------------------------->');


    process.stdin.on('keypress', async (ch, key) => {
        if (key && key.name == 'q' && next_actions.length > 0 && this.current_actions > 0) {
            let completed = actions_max - next_actions.length;
            let last_action_date = new Date();
            let processed_ms = last_action_date - started_date;
            let processed_sec = (processed_ms * 0.001);
            let action_speed = completed / processed_sec;
            console.log('<----------------------------------------------------------------->');
            console.log('Использование ЦП:\t', (await cpu_usage()).toFixed(0),'%');
            console.log('Выполняется процессов:\t', maxExecuting);
            console.log('Выполнено:\t\t', completed, '/', actions_max);
            console.log('Осталось:\t\t', next_actions.length, '/', actions_max);
            console.log('Скорость:\t\t', Number(action_speed.toFixed(1)), 'act/sec');
            console.log('Работет:\t\t', Math.round(processed_sec/60), 'мин');
            console.log('Заверешние через:\t', Math.round(next_actions.length/action_speed/60), 'мин');
        }
        if (key && key.name == 'p' ) {
            console.log('<----------------------------------------------------------------->');
            if (maxExecuting > 0){
                maxExecuting = 0;
                console.log('Пауза');
            } else {
                maxExecuting = setting_StartExecuting;
                console.log('Возобновление');
                await ActionsController();
            }
            console.log('Количество прроцессов уменьшено до', maxExecuting);
        }

        if (key && key.name == 'a' && maxExecuting > 1 ) {
            maxExecuting = maxExecuting - 1;
            console.log('<----------------------------------------------------------------->');
            console.log('Количество прроцессов уменьшено на', 1);
            console.log('Сейчас выполняется:\t', maxExecuting);
        }
        if (key && key.name == 's' && maxExecuting < setting_MaxExecuting ) {
            maxExecuting = maxExecuting + 1;
            console.log('<----------------------------------------------------------------->');
            console.log('Количество прроцессов увеличено на', 1);
            console.log('Сейчас выполняется:\t', maxExecuting);
        }
        if (key && key.name == 'e' ) {
            this.toggle_explorer = !this.toggle_explorer;
            console.log('<----------------------------------------------------------------->');
            console.log('Explorer изменен на', this.toggle_explorer);
            if (this.toggle_explorer) {
                exec(`explorer.exe`);
            } else {
                kill_process('explorer.exe');
            }
        }
        
        if (key && key.ctrl && key.name == 'c') {
            process.exit(0)
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();
}

const init_calc_action = async ( beatmaps = [], { acc = 100, mods } ) => {
    console.time('loading');
    console.log(`calc > loading > ${acc}% ${mods.join('+')}`);

    const mods_int = ModsToInt(mods);

    calculated_osu_beatmaps = await MYSQL_GET_ALL( 'osu_beatmap_pp', { mods: mods_int, accuracy: Number(acc) } );

    const calculated_set = new Set( calculated_osu_beatmaps.map( (x) => `${x.md5}:${x.accuracy}:${x.mods}` ));

    console.log('loaded calculated records:', calculated_osu_beatmaps.length)

    //const actions_with_mods = actions.map( val => { return {...val, mods_int } });

    console.log('checking beatmaps', beatmaps.length);

    for (let beatmap of beatmaps){
        if (beatmap.ranked !== 4 || beatmap.gamemode !== 'osu'){
            console.log('skip >', beatmap.md5)
            continue;
        }

        let args = {...beatmap, acc, mods_int, mods };

        if (calculated_set.has( `${args.md5}:${args.acc}:${args.mods_int}`) === false) {
            next_actions.push( args );
        }
        
    }

    console.log('added actions:', next_actions.length);

    actions_max = next_actions.length;

    console.timeEnd('loading');

    console.log('start calcing..');

    started_date = new Date();

    ended_count = null;

    if (this.current_actions < maxExecuting){
        await ActionsController();
    }

    return await new Promise (res => setInterval( () => { if(ended_count === 0 || ended_count < 0) { res(true)} }, 1000 ));
}

module.exports = {
    init_calc_action: init_calc_action,
    //calc_from_mysql: calc_from_mysql
}

