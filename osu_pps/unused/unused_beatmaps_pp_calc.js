
ev.on('save_json', async({md5, data}) => {

    jsons.push({ md5, data });

    const results = jsons.filter( val => val.md5 === md5 );

    if (results.length === actions.length){
        fs.writeFileSync(path.join(output_path, `${md5}.json`), JSON.stringify( results.map( val => val.data ) ), { encoding: 'utf8' });
        jsons = jsons.filter( val => val.md5 !== md5 );
        ev.emit('calcStart');
    };
});


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

const get_scanned = () => {
    this.jsons_scanned = fs.readdirSync(output_path, {encoding: 'utf8'});
}


ev.on('calcAction',  ({md5, gamemode, acc, mods}) => {
    
    /*if (calculated_osu_beatmaps.findIndex( x => 
        x.md5 === md5 &&
        x.accuracy === Number(acc) && 
        x.mods === ModsToInt(mods) ) > -1 ){
            //console.log('skip >', md5, acc, mods)
            if (current_actions < maxExecuting){
                ev.emit( 'ActionsController');
            }
            current_actions--;
            return;
    }*/

    //console.log('calc >', md5, acc, mods.join('+'))