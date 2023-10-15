const { spawn } = require("child_process")
const path = require("path");
const fs = require("fs");
const { EventEmitter } = require("events");
const { saveError } = require("./modules/logserver");

const calc_exe = path.join(__dirname,'bin/pp_calculator/PerformanceCalculator.exe');
const ev = new EventEmitter();

const modes = ['osu', 'taiko', 'catch', 'mania']

const md5_stock = 'D:\\osu_md5_stock';

const output_path = '.\\data\\beatmaps_data\\';

const maxExecuting = 4;

let ProcParams = [];
let jsons = [];

const actions = [
    {acc: '100'}, 
    {acc: '99'}, 
    {acc: '98'}, 
    {acc: '95'}
]

ev.on ('calcStart', async ()=>{
    if (ProcParams.length === 0) {
        console.log('program ended');
        return;
    }

    const args = ProcParams.shift();

    //if (this.jsons_scanned.indexOf(`${args.md5}.json`) > -1){
    //    console.log('skip >', args.md5)
    //    ev.emit('calcStart');
    //    return;
    //}
    console.log('>', args.md5);

    actions.map( val => {
        ev.emit( 'calc', {...args, ...val} );
    })

});

ev.on('calc',  async ({md5, mode, acc}) => {
    let acc_args = `-a ${acc}`;

    if (modes[mode] === 'mania'){
        acc_args = `-s ${acc*10000}`
    }

    const proc = spawn( calc_exe, [
        'simulate', 
        modes[mode], 
        '-j',
        `${path.join(md5_stock, `${md5}.osu`)}`,
        acc_args,
    ], {windowsHide: true});

    let result = '';

    proc.stdout.on('data', (data) => {
        result += data;
    })

    proc.stdout.on('close', () =>{
        if (result.length > 0){
            ev.emit('save_json', { md5, data: JSON.parse(result) })
        }
    });

    proc.stderr.on('data', (data) => {
        console.error(md5, modes[mode], acc)
        console.log(data.toString())
        fs.copyFileSync( path.join(md5_stock, `${md5}.osu`), 'F:\\node_js_stuff\\node_projects\\a_discord_bot\\calc_error\\' + `${md5}.osu` )
        saveError(['beatmaps_pp_calc.js','en.on(calc)',md5, modes[mode], acc, data.toString()].join(' > '));
        ev.emit('calcStart');
    });

    proc.on('error', (err)=>{
        console.error(err)
        fs.copyFileSync( path.join(md5_stock, `${md5}.osu`), 'F:\\node_js_stuff\\node_projects\\a_discord_bot\\calc_error\\' + `${md5}.osu` )
        saveError(['beatmaps_pp_calc.js', 'proc.on(error', md5, modes[mode], acc ,data.toString()].join(' > '));
        ev.emit('calcStart');
    })
});

ev.on('save_json', async({md5, data}) => {

    jsons.push({ md5, data });

    const results = jsons.filter( val => val.md5 === md5 );

    if (results.length === actions.length){
        fs.writeFileSync(path.join(output_path, `${md5}.json`), JSON.stringify( results.map( val => val.data ) ), { encoding: 'utf8' });
        jsons = jsons.filter( val => val.md5 !== md5 );
        ev.emit('calcStart');
    };
});

const beatmaps_md5_db = 'beatmaps_md5_db.json';

const scan_osu = () => {
    console.log('scaning dirs..');

    if (fs.existsSync('scan_songs.json')){
        ProcParams = JSON.parse(fs.readFileSync('scan_songs.json', {encoding: 'utf8'}));
        return;
    }
    
    let beatmaps_db;
    
    if ( fs.existsSync( beatmaps_md5_db ) ){ 
        beatmaps_db = JSON.parse( fs.readFileSync( beatmaps_md5_db, {encoding: 'utf8'} ))}
    else { return; }

    const files = fs.readdirSync( md5_stock );
    
    for ( let i = 0; i < files.length; i++){
        
        if (i % 2000 == 0){
            console.log( (i / files.length * 100).toFixed(2), '%' );
        } 

        const filepath = path.join(md5_stock, files[i]);
        const md5 = path.basename(files[i], '.osu');
        
        /*if (this.jsons_scanned.indexOf(`${md5}.json`) > -1){
            continue;
        }*/

        const data = fs.readFileSync( filepath, {encoding: 'utf8'} );
        const match = data.match( /mode:[ ]*([0-3])/i);

        let mode = 'osu';

        if (match && match[1]){
            let mode_int = parseInt(match[1]);
            mode = modes[mode_int];
        }

        //ProcParams.push({ md5, mode });

        if (mode !== 'osu'){
            ProcParams.push({ md5, mode });
        }
    }
    

    fs.writeFileSync('scan_songs.json',JSON.stringify(ProcParams), {encoding: 'utf8'});
    console.log('[scanned]', files.length, 'files')
}

const get_Mode_from_file= async (filepath)=>{
    fs.open(filepath, (err, fd) =>{

        fs.read(fd, filebuf, 0, 2000, 0)
        fs.close(fd);
    })

}

const get_scanned = () => {
    this.jsons_scanned = fs.readdirSync(output_path, {encoding: 'utf8'});
}

/*
get_scanned();
scan_osu();*/


module.exports = {
    init_calc: (args) => {
        ProcParams = args;
        console.log('start calcing..')
        for( i = 0; i < maxExecuting; i++){
            ev.emit('calcStart');
        }
    }
}

