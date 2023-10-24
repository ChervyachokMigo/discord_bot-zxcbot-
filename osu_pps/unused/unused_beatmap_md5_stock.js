
//unused
const calculated_jsons_path = '.\\data\\beatmaps_data\\';

const modes = ['osu', 'taiko', 'catch', 'mania']

const beatmaps_md5_db = 'beatmaps_md5_db.json';

let ProcParams = [];
let jsons = [];

const output_path = '.\\data\\beatmaps_data\\';

const md5_stock_calculate = async () => {

    const beatmaps_db = fs.existsSync( beatmaps_md5_db ) ? 
        JSON.parse( fs.readFileSync( beatmaps_md5_db, {encoding: 'utf8'} )) : 
        make_beatmaps_db();


    const osu_md5_stock_files = fs.readdirSync( osu_md5_stock ).map( x => x.slice(0, x.length - 4 ));

    const calculated_files = fs.readdirSync( calculated_jsons_path ).map( x => x.slice(0, x.length - 5 ));

    function difference ( a, b ) {
        const stock = new Set(b);
        return a.filter( x => stock.has( x ) === false );
    }

    function includes ( a, b ) {
        const stock = new Set(b);
        return a.filter( x => stock.has( x.md5 ) === true );
    }

    const to_calc = difference ( osu_md5_stock_files, calculated_files );

    const calced = includes( beatmaps_db, to_calc );

    const to_parse = difference(to_calc, calced.map( x => x.md5) );

    let parsed = [];

    for (const file of to_parse){
        const filepath = path.join(osu_md5_stock, `${file}.osu`);
        const data = fs.readFileSync( filepath, {encoding: 'utf8'} );
        const match = data.match( /mode:[ ]*([0-3])/i);
    
        let mode = null;
    
        if (match && match[1]){
            mode = parseInt(match[1]);
        } else {
            if (data.indexOf('[HitObjects]') === -1){
                console.error('> error > empty map > can not found game mode of ', md5);
                continue;
            }
            mode = 0;
        }

        parsed.push({md5: file, mode});
    }

    const ProcParams = [...calced, ...parsed];

    await init_calc(ProcParams);

}