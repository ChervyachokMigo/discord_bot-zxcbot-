const fs = require('fs');
const bitwise = require( 'bitwise');
const path = require('path');
const md5File = require('md5-file');

const { loadCachedBeatmap, saveBeatmapToCache } = require('./osu_replay_cache.js');
const { getNoteTypeByNoteBits, 
    NOTETYPE, NOTECOLOR } = require('./osu_note_types.js');

const { osuNewBeatmapDir, osuPath } = require('../../settings.js');

function getPropery(data, symbol=':', position=1){
	var res = data.split(symbol)
	return res[position].trim()
}

function getHitWindows(OD){
    var hit300,  hit100, hit0;
    OD = Number(OD);
    if (isNaN(OD)) return null;
    if (OD<5){
        hit300 = 35 - (35 - 50) * (5 - OD) / 5 ;
        hit100 = 80 - (80 - 120) * (5 - OD) / 5 ;
        hit0 = 95 - (95 - 135) * (5 - OD) / 5 ; 
    }
    if (OD>5){
        hit300 = 35 + (20 - 35) * (OD - 5) / 5 ;
        hit100 = 80 + (50 - 80) * (OD - 5) / 5 ;
        hit0 = 95 + (70 - 95) * (OD - 5) / 5 ;
    }
        
    if (OD==5){
        hit300 = 35 ;
        hit100 = 80 ;
        hit0 =  95 ;
    }
    return {hit300, hit100, hit0};
}

function readLocalBeatmap(beatmapCurrentdir, beatmapRelativePathWithOsuFile, beatmap_info = {}){
    beatmapCurrentdir = beatmapCurrentdir.replaceAll('\\','/');
    var beatmapAbsolutePath = `${beatmapCurrentdir}/${beatmapRelativePathWithOsuFile}`.replaceAll('\\','/');
    var beatmap_text = fs.readFileSync(beatmapAbsolutePath, {encoding: 'utf-8'});
    beatmap_text = beatmap_text.split("\n"); 

    beatmap_info.notes = [];
    beatmap_info.OD = 0;
    beatmap_info.notes_info = {
        count_hitcircles: 0,
        count_don: 0,
        count_katsu: 0,
        count_big_don: 0,
        count_big_katsu: 0,
        count_drumroll: 0,
        count_denden: 0
    };

    let HitObjectsFind = 0;
    
    beatmap_info.isSongs = true;
    if (!beatmap_info.beatmap_md5){
        beatmap_info.isSongs = false;
        beatmap_info.osu_filename = path.basename(beatmapAbsolutePath);
        beatmap_info.beatmap_md5 = md5File.sync(beatmapAbsolutePath);
        beatmap_info.folderName = path.dirname(beatmapRelativePathWithOsuFile);
    }

    for(let i in beatmap_text) {
        if (beatmap_info.isSongs == false){
            if (beatmap_text[i].toLowerCase().trim().startsWith("artist:") == true)
                beatmap_info.artist = getPropery(beatmap_text[i]);
            if (beatmap_text[i].toLowerCase().trim().startsWith("title:") == true)
                beatmap_info.title = getPropery(beatmap_text[i]);
           /* if (beatmap_text[i].toLowerCase().trim().startsWith("artistunicode") == true)
                beatmap_info.artist = getPropery(beatmap_text[i]);
            if (beatmap_text[i].toLowerCase().trim().startsWith("titleunicode") == true)
                beatmap_info.title = getPropery(beatmap_text[i]);*/
            if (beatmap_text[i].toLowerCase().trim().startsWith("creator") == true)
                beatmap_info.creator = getPropery(beatmap_text[i]);
            if (beatmap_text[i].toLowerCase().trim().startsWith("version") == true)
                beatmap_info.difficulty = getPropery(beatmap_text[i]);
            if (beatmap_text[i].toLowerCase().trim().startsWith("beatmapid") == true)
                beatmap_info.difficultyID = getPropery(beatmap_text[i]);
            if (beatmap_text[i].toLowerCase().trim().startsWith("beatmapsetid") == true)
                beatmap_info.beatmapID = getPropery(beatmap_text[i]);
            if (beatmap_text[i].toLowerCase().trim().startsWith("mode") == true)
                beatmap_info.gamemode = getPropery(beatmap_text[i]);
        }
        if (beatmap_text[i].toUpperCase().trim().startsWith("OVERALLDIFFICULTY") == true){
            beatmap_info.OD = getPropery(beatmap_text[i])
        }
        if (beatmap_text[i].toLowerCase().startsWith("[hitobjects]") == true ){
            HitObjectsFind = 1
            continue;
        }
        if (HitObjectsFind == 1){
            if (beatmap_text[i].toLowerCase().startsWith("[")){
                HitObjectsFind = 0;
                break;
            }
            //доделать
            if (beatmap_text[i].trim().length>0){
                let newhitpoint = {raw: beatmap_text[i].replace('\r','').split(',') };
                newhitpoint.x = parseInt(newhitpoint.raw[0]);
                newhitpoint.y = parseInt(newhitpoint.raw[1]);
                newhitpoint.time = parseInt(newhitpoint.raw[2]);
                newhitpoint.type = bitwise.byte.read(parseInt(newhitpoint.raw[3]));
                newhitpoint.hitSound = bitwise.byte.read(parseInt(newhitpoint.raw[4]));
                newhitpoint.objectParams = '';
                for (let h = 5; h < newhitpoint.raw.length; h++){
                    if( (newhitpoint.raw[h].trim()).length > 0 ){
                        newhitpoint.objectParams += newhitpoint.raw[h];
                    }
                }
                let Note = getNoteTypeByNoteBits(newhitpoint);
                beatmap_info.notes.push(Note);
                if (Note.type == NOTETYPE.HITCIRCLE){
                    beatmap_info.notes_info.count_hitcircles++;
                    if (Note.big == false){
                        if (Note.color == NOTECOLOR.DON) beatmap_info.notes_info.count_don++;
                        if (Note.color == NOTECOLOR.KATSU) beatmap_info.notes_info.count_katsu++;
                    } else {
                        if (Note.color == NOTECOLOR.DON) beatmap_info.notes_info.count_big_don++;
                        if (Note.color == NOTECOLOR.KATSU) beatmap_info.notes_info.count_big_katsu++;
                    }
                }
                if (Note.type == NOTETYPE.SLIDER){
                    beatmap_info.notes_info.count_drumroll++
                }
                if (Note.type == NOTETYPE.SPINNER){
                    beatmap_info.notes_info.count_denden++
                }
            }
        }
    }

    beatmap_info.lastnote = beatmap_info.notes[beatmap_info.notes.length-1];

    return beatmap_info
}

async function beatmap_in_folder(beatmap_md5, SongsFolderRelative, beatmap_folder){
    return await new Promise((res,rej)=>{
        var result = undefined;
        try{
            let beatmap_files = fs.readdirSync(`${SongsFolderRelative}/${beatmap_folder}`, {encoding: 'utf-8'});
            if (beatmap_files && beatmap_files.length && beatmap_files.length>0){
                for(let filename of beatmap_files){
                    if (path.extname(filename)==='.osu'){
                        let hash = md5File.sync(`${SongsFolderRelative}/${beatmap_folder}/${filename}`);
                        if (beatmap_md5 === hash){
                            result = `${beatmap_folder}/${filename}`;
                            res(result);
                            break;
                        }
                        
                    }
                }
            }
        } catch (e){
            if (e.code === 'ENOENT'){
                console.log(`Не найдена папка ${beatmap_folder}`);
            } else {
                console.log(e);
            } 
            //результат остается Undefined
        }
        res(result);
    });
}

module.exports = {
    getHitWindows: getHitWindows, 

    getBeatmap: function(beatmap_info){
        let cachedBeatmap = loadCachedBeatmap(beatmap_info.beatmap_md5);
        if (cachedBeatmap) {
            //найдена кэшированая карта
            return cachedBeatmap;
        }

        if (beatmap_info.isSongs ==  true){
            var AbsolutePath = `${osuPath}\\Songs`;
        } else {
            var AbsolutePath = `${process.cwd()}/${osuNewBeatmapDir}`;
        }
        beatmap_info = readLocalBeatmap(
            AbsolutePath, 
            `${beatmap_info.folderName}/${beatmap_info.osu_filename}`, 
            beatmap_info
        );

        saveBeatmapToCache(beatmap_info);
        return beatmap_info;
    },

    beatmap_in_folder: beatmap_in_folder,

    //в ручную сканировать битмапу
    readLocalBeatmap: function(beatmapsCurentDir, beatmap_path){ //для экспорта
        var beatmap_info = {};

        beatmap_info = readLocalBeatmap(beatmapsCurentDir, beatmap_path, beatmap_info); //вызов локальной функции
        saveBeatmapToCache(beatmap_info);
        return beatmap_info;
    },
}        