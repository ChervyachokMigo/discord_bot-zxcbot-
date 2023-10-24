const EventEmitter = require("events");
const { readdirSync, fstat, readFileSync, writeFileSync } = require("fs");
const path = require("path");

const jsons_path = path.join(__dirname, 'data\\beatmaps_data');

const files = readdirSync( jsons_path );

this.info = [];

let i = 0;

const ev = new EventEmitter();

for (const file of files){
    if (i % 5000 === 0) {
        console.log( (i/files.length *100).toFixed(2), '%')
    }
    const data = JSON.parse(readFileSync( path.join( jsons_path, file), {encoding: 'utf8'} ));

    if (data[0].score.ruleset_id !== 0) {
        continue;
    }

    const pps = data.map( x => { return { 
        acc: Math.round(x.score.accuracy), 
        pp: {
            aim: x.performance_attributes.aim,
            speed: x.performance_attributes.speed,
            accuracy: x.performance_attributes.accuracy,
            total: x.performance_attributes.pp
        },
        diff: {
            aim: x.difficulty_attributes.aim_difficulty,
            speed: x.difficulty_attributes.speed_difficulty,
            star: x.difficulty_attributes.star_rating,
        }

    }});

    this.info.push( {md5: file.slice(0, file.length - 5), pps});
    i++;
    //break;
}

writeFileSync('md5_pps_osu.json', JSON.stringify(this.info));
