const path = require("path");
const md5File = require('md5-file');
const fs = require("fs");
const { globSync } = require( 'glob' );  

const {osu_md5_stock, osuPath} = require('../settings.js');

const beatmaps_md5_db = path.join('data', 'osu_pps', 'beatmaps_md5_db.json');

const blocked_files = [
    '7618a9c8a083537383bb76d641762159',
    'd41d8cd98f00b204e9800998ecf8427e'
];

const make_beatmaps_db = () => {

    console.log('> make_beatmaps_db > reading "Songs"...');

    let beatmaps_db = fs.existsSync( beatmaps_md5_db )? 
        JSON.parse( fs.readFileSync( beatmaps_md5_db, {encoding: 'utf8'} )): [];

    const beatmaps_list = beatmaps_db.filter( val => blocked_files.indexOf( val.md5 ) === -1 ).map( data => data['fpr'] );

    const files = globSync( path.join(osuPath, 'Songs') + '/**/*.osu', { 
            absolute: false, 
            cwd: path.join(osuPath, 'Songs')
        });

    for ( const filepath_relative of files ){
        if ( beatmaps_list.indexOf(filepath_relative) === -1){
            const filepath = path.join( osuPath, 'Songs', filepath_relative );
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

            beatmaps_db.push( {fpr: filepath_relative, md5, mode } );
        }
    }

    fs.writeFileSync( beatmaps_md5_db, JSON.stringify(beatmaps_db), {encoding: 'utf8'} );
    console.log('> make_beatmaps_db > save json');
    
    return beatmaps_db;
}

const md5_stock_compare = () => {

    console.log('> md5_stock_compare > checking...');

    const md5s = fs.readdirSync( osu_md5_stock );

    const beatmaps_db = fs.existsSync( beatmaps_md5_db ) ? 
        JSON.parse( fs.readFileSync( beatmaps_md5_db, {encoding: 'utf8'} )) : 
        make_beatmaps_db();

    function difference ( bm, md ) {
        const md5_set = new Set(md);
        return bm.filter( x => md5_set.has( `${x.md5}.osu` ) === false );
    }

    const to_copy = difference ( beatmaps_db, md5s );

    for (const file of to_copy){
        fs.copyFileSync( path.join( osuPath, 'Songs', file.fpr ), path.join( osu_md5_stock, `${file.md5}.osu` ) );
        console.log('> copy', file.md5);
    }

    console.log('> md5_stock_compare > complete');

}

module.exports = {
    make_beatmaps_db: make_beatmaps_db,
    md5_stock_compare: md5_stock_compare
}