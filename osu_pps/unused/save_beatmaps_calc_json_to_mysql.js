
const { Sequelize, DataTypes } = require('@sequelize/core');


const {  DB_USER, DB_PASSWORD } = require("./config.js");
const { readdirSync, readFileSync, renameSync, rmSync } = require('fs');
const path = require('path');

const osu_beatmaps_mysql = new Sequelize( 'osu_beatmaps', DB_USER, DB_PASSWORD, { 
    dialect: `mysql`,
    define: {
        updatedAt: false,
        createdAt: false,
        deletedAt: false
    },
});

const osu_beatmap_pp = osu_beatmaps_mysql.define ('osu_beatmap_pp', {
    md5: {type: DataTypes.STRING(32),  defaultvalue: '', allowNull: false},
    beatmap_id: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    mods: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    accuracy: {type: DataTypes.INTEGER,  defaultvalue: 100, allowNull: false},
    pp_total: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    pp_aim: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    pp_speed: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    pp_accuracy: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    stars: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    diff_aim: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    diff_speed: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    diff_sliders: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    speed_notes: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    AR: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    OD: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    
});

const beatmaps_pp_path = path.join(__dirname, 'data', 'beatmaps_data');
const backups = path.join(__dirname, 'data', 'beatmaps_data_backups');

const main = async () => {
    await osu_beatmaps_mysql.sync({ logging: '', alter: true});
    //const exists_records = await osu_beatmap_pp.findAll({ logging: ''}).dataValues;
    let i = 0;
    const files = readdirSync(beatmaps_pp_path, { encoding: 'utf8' } );
    for (const file of files ){
        if (i % 2000 === 0) {
            console.log( i/files.length*100, '%');
        }
        i++;
        const filepath = path.join(beatmaps_pp_path, file);
        const content = JSON.parse(readFileSync(filepath, { encoding: 'utf8'}));
        if (content[0].score.ruleset_id === 0){
            if (content[0].score.accuracy === 'NaN'){
                console.log('[delete] > ', file);
                rmSync(filepath);
                continue;
            }
            for (let params of content){
                const data = {
                    md5: file.slice(0, file.length - 5),
                    beatmap_id: params.score.beatmap_id,
                    mods: 0,
                    accuracy: Math.round(params.score.accuracy),
                    pp_total: Math.round(params.performance_attributes.pp),
                    pp_aim: Math.round(params.performance_attributes.aim),
                    pp_speed: Math.round(params.performance_attributes.speed),
                    pp_accuracy: Math.round(params.performance_attributes.accuracy),
                    stars: params.difficulty_attributes.star_rating,
                    diff_aim: params.difficulty_attributes.aim_difficulty,
                    diff_speed: params.difficulty_attributes.speed_difficulty,
                    diff_sliders: params.difficulty_attributes.slider_factor,
                    speed_notes: Math.round(params.difficulty_attributes.speed_note_count),
                    AR: params.difficulty_attributes.approach_rate,
                    OD: params.difficulty_attributes.overall_difficulty,
                }
                await osu_beatmap_pp.create(data, {logging: ''});
            }
            renameSync(filepath, path.join(backups, file));
        }
    }
    
}

main();