const path = require("path");

const fs = require("fs");

const { MYSQL_GET_ALL, MYSQL_SAVE } = require("./modules/DB/base.js");

const { prepareDB } = require("./modules/DB/defines.js");


const main = async () => {
    await prepareDB();

    const data = fs.readFileSync('./.trash/beatmaps_pps_bad_without_id.csv', {encoding: 'utf8'}).split('\n')
    .map( x => x.replace(/["\r﻿]/gi,'').split(',') )

    const header = data.shift();
    /*Object.fromEntries(Object.entries({...}).map(
        ([key, value]) => [value, null]
    ));*/

    const content = data.map ( x => x.map ( (y, i) => i > 0? Number(y): y) );
   

    const content_objects = content.map( x => Object.fromEntries( x.map( (y, i) => [header[i], y] ) ));

    for (let chunk of splitArray( content_objects, 500) ){

        await MYSQL_SAVE('osu_beatmap_pp', 0, chunk)
    }
    

}

main();

function splitArray (arr, len) {

    var chunks = [],
        i = 0,
        n = arr.length;
  
    while (i < n) {
      chunks.push(arr.slice(i, i += len));
    }
  
    return chunks;
  }