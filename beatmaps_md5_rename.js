const path = require("path");
const md5File = require('md5-file');
const fs = require("fs");
const {osu_md5_stock, osuPath} = require('./settings.js');

const beatmaps_md5_db = 'beatmaps_md5_db.json';

const make_beatmaps_db = () => {
    const blocked_files = [
        '7618a9c8a083537383bb76d641762159',
        'd41d8cd98f00b204e9800998ecf8427e'
    ];

    console.log('scaning dirs..');

    let beatmaps_db = fs.existsSync( beatmaps_md5_db )? 
        JSON.parse( fs.readFileSync( beatmaps_md5_db, {encoding: 'utf8'} )): [];

    const beatmaps_list = beatmaps_db.filter( val => blocked_files.indexOf( val.md5 ) === -1 ).map( data => data['fpr'] );

    console.time('test');

    const dirs = fs.readdirSync( path.join( osuPath, 'Songs'), { withFileTypes: true } );

    let i = 0;

    for (const dir of dirs){

        if ( dir.isDirectory() === true){

            if (i % 1000 === 0) {
                console.log(i, '/', dirs.length);
                console.timeLog('test')
            }

            const files = fs.readdirSync( path.join(osuPath, 'Songs', dir.name) );

            for ( const file of files ){

                const filepath_relative =  path.join( dir.name, file );
                const filepath = path.join( osuPath, 'Songs', filepath_relative );

                if ( file.slice( file.length - 3 ) === 'osu' ){

                    if ( beatmaps_list.indexOf(filepath_relative) === -1){
                        const md5 = md5File.sync( filepath );

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

                        beatmaps_db.push( {fpr: filepath_relative, md5, mode } )
                    }
                }
            }
        }

        i++;

    }

    fs.writeFileSync( beatmaps_md5_db, JSON.stringify(beatmaps_db), {encoding: 'utf8'} );
    return beatmaps_db;
}

const md5_stock_compare = () => {

    console.log('> md5_stock_compare');

    const md5s = fs.readdirSync( osu_md5_stock );

    const beatmaps_db = fs.existsSync( beatmaps_md5_db ) ? 
        JSON.parse( fs.readFileSync( beatmaps_md5_db, {encoding: 'utf8'} )) : 
        beatmaps_db();

    function difference ( bm, md ) {
        const md5_set = new Set(md);
        return bm.filter( x => md5_set.has( `${x.md5}.osu` ) === false );
    }

    const to_copy = difference ( beatmaps_db, md5s );

    for (const file of to_copy){
        fs.copyFileSync( path.join( osuPath, 'Songs', file.fpr ), path.join( osu_md5_stock, `${file.md5}.osu` ) );
        console.log('> copy', file.md5);
    }

}

md5_stock_compare()
module.exports = {
    make_beatmaps_db: make_beatmaps_db,
    md5_stock_compare: md5_stock_compare
}