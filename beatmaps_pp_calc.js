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

    if (this.jsons_scanned.indexOf(`${args.md5_name}.json`) > -1){
        console.log('skip >', args.md5_name)
        ev.emit('calcStart');
        return;
    }
    console.log('>', args.md5_name);

    actions.map( val => {
        ev.emit( 'calc', {...args, ...val} );
    })

});

ev.on('calc',  async ({md5_name, mode, acc}) => {
    let acc_args = `-a ${acc}`;

    if (mode === 'mania'){
        acc_args = `-s ${acc*10000}`
    }

    const proc = spawn( calc_exe, [
        'simulate', 
        mode, 
        '-j',
        `${path.join(md5_stock, `${md5_name}.osu`)}`,
        acc_args,
    ]);

    let result = '';

    proc.stdout.on('data', (data) => {
        result += data;
    })

    proc.stdout.on('close', () =>{
        if (result.length > 0){
            ev.emit('save_json', { md5_name, data: JSON.parse(result) })
        }
    });

    proc.stderr.on('data', (data) => {
        console.error(md5_name, mode, acc)
        console.log(data.toString())
        saveError(['beatmaps_pp_calc.js','en.on(calc)',md5_name, mode, acc, data.toString()].join(' > '));
        ev.emit('calcStart');
    });

    proc.on('error', (err)=>{
        console.error(err)
        saveError(['beatmaps_pp_calc.js', 'proc.on(error', md5_name, mode, acc ,data.toString()].join(' > '));
        ev.emit('calcStart');
    })
});

ev.on('save_json', async({md5_name, data}) => {

    jsons.push({ md5: md5_name, data });

    const results = jsons.filter( val => val.md5 === md5_name );

    if (results.length === actions.length){
        fs.writeFileSync(path.join(output_path, `${md5_name}.json`), JSON.stringify( results.map( val => val.data ) ), { encoding: 'utf8' });
        jsons = jsons.filter( val => val.md5 !== md5_name );
        ev.emit('calcStart');
    };
});

const scan_osu = () => {
    console.log('scaning dirs..');

    if (fs.existsSync('scan_songs.json')){
        ProcParams = JSON.parse(fs.readFileSync('scan_songs.json', {encoding: 'utf8'}));
        return;
    }
    
    const files = fs.readdirSync( md5_stock );
    
    for ( let i = 0; i < files.length; i++){
        if (i % 2000 == 0){
            console.log( (i / files.length * 100).toFixed(2), '%' );
        } 
        const filepath = path.join(md5_stock, files[i]);
        const md5_name = path.basename(files[i], '.osu');
        
        if (this.jsons_scanned.indexOf(`${md5_name}.json`) > -1){
            continue;
        }

        const data = fs.readFileSync( filepath, {encoding: 'utf8'} );
        const match = data.match( /mode:[ ]*[0-3]/i);
        let mode = 'osu';

        if (match && match[1] >=0 && match[1] <=3){
            mode = modes[match[1]];
        }

        ProcParams.push({ md5_name, mode });
    }
    

    fs.writeFileSync('scan_songs.json',JSON.stringify(ProcParams), {encoding: 'utf8'});
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

get_scanned();
scan_osu();


console.log('start calcing..')
for( i = 0; i < maxExecuting; i++){
    ev.emit('calcStart');
}