const fs = require('fs');
const path = require('path');

const { log } = require("../../tools/log.js");

const osufile = require('./osu_reader_functions.js');
const { readLocalBeatmap } = require('./osu_beatmap.js');

const { osuPath, osuNewBeatmapDir } = require('../../settings.js');

const osu_db_JSON_filename = 'data/osuReplays/osudb_data.json';

var osu_db = {
    beatmaps: {},
    isloaded: false,
    osu_version: 0,
};

function isLoaded(){
    return osu_db.isloaded;
}

async function init (){
    log('Инициализация osu_db');
    if(beatmaps_load()){
        log('Загружена osu_db');
        osu_db.isloaded = true;
        return true;
    } else {
        log('osu_db не обнаружена, будет спаршен osu.db...');
        if (await startParsingDB()){
            log('Парсинг завершен. Сохранение...');
            if (beatmaps_save()){
                log('Сохранена osu_db');
                startParsingExtractedDownloads();
                osu_db.isloaded = true;
                return true;
            } else {
                log('Не удалось сохранить osu_db');
                return false;
            }
        } else {
            log('Не удалось спарсить osu.db');
            return false;
        }
    }
}

async function startParsingDB(){
    try{        
        await osufile.openFile(`${osuPath}\\osu!.db`);

        osu_db.osu_version = await osufile.getInt();
        
        osu_db.folder_count = await osufile.skipInt();

        osu_db.isAccountUnlocked = await osufile.skipBool();
        osu_db.AccountUnlockedDate = await osufile.skipDate();

        osu_db.playername = await osufile.skipString();

        osu_db.number_beatmaps = await osufile.getInt();

        osu_db.beatmaps = [];
        for (let i = 0; i < osu_db.number_beatmaps; i++){

            osu_db.beatmaps.push (await parsingBeatmapData());

            if (i%1000==0){
                console.log('Парсинг osu.db: ', Math.trunc ( i / osu_db.number_beatmaps * 1000 ) / 10, '%');
            }
        }

        osu_db.userPermissions = await osufile.skipInt();

        await osufile.closeFile();

        return true;
    } catch (e){
        console.log(e);
        return false;
    }
}

async function parsingBeatmapData(){
    var beatmap = {};

    if (osu_db.osu_version<20191106)
        beatmap.beatmap_size = await osufile.skipInt();

    beatmap.artist = await osufile.getString();

    beatmap.artist_unicode = await osufile.skipString();

    beatmap.title = await osufile.getString();

    beatmap.title_unicode = await osufile.skipString();

    beatmap.creator = await osufile.getString();
    beatmap.difficulty = await osufile.getString();

    beatmap.audio_filename = await osufile.skipString();
    
    beatmap.beatmap_md5 = await osufile.getString();
    beatmap.osu_filename = await osufile.getString();

    beatmap.ranked_status = await osufile.skipByte();

    beatmap.number_hitcircles = await osufile.skipShort();
    beatmap.number_sliders = await osufile.skipShort();
    beatmap.number_spinners = await osufile.skipShort();

    beatmap.mod_date = await osufile.skipLong();

    if (osu_db.osu_version<20140609){
        beatmap.AR = await osufile.skipByte();
        beatmap.CS = await osufile.skipByte();
        beatmap.HP = await osufile.skipByte();
        beatmap.OD = await osufile.skipByte();
    } else {
        beatmap.AR = await osufile.skipSingle();
        beatmap.CS = await osufile.skipSingle();
        beatmap.HP = await osufile.skipSingle();
        beatmap.OD = await osufile.skipSingle();
    }
    beatmap.slider_velocity = await osufile.skipDouble();

    if (osu_db.osu_version>=20140609){
        beatmap.SRstd = await osufile.skipIntDoublePair();
        beatmap.SRtaiko = await osufile.skipIntDoublePair();
        beatmap.SRctb = await osufile.skipIntDoublePair();
        beatmap.SRmania = await osufile.skipIntDoublePair();
    }

    beatmap.draintime = await osufile.skipInt();
    beatmap.totaltime = await osufile.skipInt();
    beatmap.previewtime = await osufile.skipInt();

    beatmap.timingpoints = await osufile.skipTimingPoints2();

    beatmap.difficultyID = await osufile.getInt();
    beatmap.beatmapID = await osufile.getInt();
    beatmap.threadID = await osufile.skipInt();

    beatmap.gradeAchievedStd = await osufile.skipByte();
    beatmap.gradeAchievedTaiko = await osufile.skipByte();
    beatmap.gradeAchievedCTB = await osufile.skipByte();
    beatmap.gradeAchievedMania = await osufile.skipByte();

    beatmap.localoffset = await osufile.skipShort();

    beatmap.stackLaniecy = await osufile.skipSingle();

    beatmap.gamemode = await osufile.getByte();

    beatmap.songSource = await osufile.skipString();
    beatmap.songTags = await osufile.skipString();

    beatmap.onlineoffset = await osufile.skipShort();

    beatmap.fontTitle = await osufile.skipString();

    beatmap.isUnplayed = await osufile.skipBool();

    beatmap.lastPlayedTime = await osufile.skipLong();

    beatmap.isOSZ2 = await osufile.skipBool();

    beatmap.folderName = await osufile.getString();

    beatmap.lastCheckedRepositoryTime = await osufile.skipLong();

    beatmap.isIgnoreHitSounds = await osufile.skipBool();
    beatmap.isIgnoreSkin = await osufile.skipBool();
    beatmap.isDisableStoryboard = await osufile.skipBool();
    beatmap.isDisableVideo = await osufile.skipBool();
    beatmap.isVisualOverride = await osufile.skipBool();

    if (osu_db.osu_version<20140609)
        beatmap.unknownvalue = await osufile.skipShort();
    
    beatmap.mod_time = await osufile.skipInt();
    beatmap.maniaScroll = await osufile.skipByte();

    beatmap.isSongs = true;

    return beatmap;
}

function beatmaps_save(){
    try{
        fs.writeFileSync(osu_db_JSON_filename, JSON.stringify(osu_db.beatmaps), {encoding: 'utf-8'});
        return true;
    } catch (e){
        console.log(e);
        return false;
    }
}

function beatmaps_load(){
    try{
        osu_db.beatmaps = JSON.parse(fs.readFileSync(osu_db_JSON_filename, {encoding: 'utf-8'}));
        return true;
    } catch (e){
        if (e.code === 'ENOENT'){
            return false;
        }
        console.log(e);
        return false;
    }
}

function startParsingExtractedDownloads(){
    try{
        log('Сканирование папки загрузки..');
        let beatmap_folders = fs.readdirSync(`${osuNewBeatmapDir}`, {encoding: 'utf-8'});
        var new_beatmaps = [];
        var AbsolutePath = `${process.cwd()}/${osuNewBeatmapDir}`;
        if (beatmap_folders && beatmap_folders.length && beatmap_folders.length>0){
            for (let beatmap_folder of beatmap_folders){
                
                let beatmap_files = fs.readdirSync(`${osuNewBeatmapDir}/${beatmap_folder}`, {encoding: 'utf-8'});
                for(let filename of beatmap_files){
                    if (path.extname(filename)==='.osu'){
                        let osu_path = `${beatmap_folder}/${filename}`
                        let beatmap_info = readLocalBeatmap(AbsolutePath, osu_path);
                        new_beatmaps.push(beatmap_info)
                    }
                }

            }
        }
        if(new_beatmaps.length>0){
            add_new_beatmaps(new_beatmaps);
        }
        log('Сканирование папки загрузки заавершено.');
        log('В базу добавлено новых '+new_beatmaps.length+' карт');
        return true;
    } catch (e){
        if (e.code === 'ENOENT'){
            return false;
        }
        console.log(e);
        return false;
    }
}

function add_new_beatmaps(beatmaps){
    log('Добавление новых '+beatmaps.length+' карт в osu_db')
    for (let beatmap of beatmaps){
        osu_db.beatmaps.push (beatmap);
    }
    log('Пересохранение osu_db..');
    beatmaps_save();
    log('Пересохранено osu_db');
}

function find_beatmap(beatmap_md5){
    let beatmap = (osu_db.beatmaps.filter(val=>val.beatmap_md5 === beatmap_md5)).shift();
    if (typeof beatmap !== 'undefined'){
        return beatmap;
    } else {
        return false;
    }
}

module.exports = {
    init_osu_db: init,

    add_new_beatmaps: add_new_beatmaps,

    find_beatmap: find_beatmap,

    osu_db_isLoaded: isLoaded,
};