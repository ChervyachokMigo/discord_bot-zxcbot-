const bitwise = require( 'bitwise');
const { v2 } = require ('osu-api-extended');

const { log } = require("../../tools/log.js");

const osufile  = require('./osu_reader_functions.js');
const { checkTokenExpires } = require (`../stalker/requests.js`);

const { getBeatmap, getHitWindows, readLocalBeatmap, beatmap_in_folder } = require('./osu_beatmap.js');
const { loadReplayCache, saveReplayCache } = require('./osu_replay_cache.js');

const { find_beatmap, add_new_beatmaps } = require('./osu_db.js');
const { beatmap_download_exec } = require('./osu_beatmap_download_exec.js');
const { beatmap_osz_extract, copyOszToSongs } = require('./osu_osz_extract.js');

const { NOTETYPE, NOTECOLOR } = require('./osu_note_types.js');
const KEYTYPE = require('../../constantes/const_osu_keys_type.js');
const HITTYPE = require('../../constantes/const_osu_hits_type.js');
const GAMEMODE = require('../../constantes/const_osu_gamemodes.js')

const { calculateMods } = require('../../constantes/const_osu_mods.js');

const { osuNewBeatmapDir } = require('../../settings.js');

async function getReplayData(replayLocalPath){

    function parsePeppyString(str){
        return str.split(',')
            .map(val=>val.split('|'))
            .filter(val=>val.length>=4 && val[0]!=='-12345');
    }

    try{
        var osu_replay = {};
        await osufile.openFile(replayLocalPath);
        
        osu_replay.gamemode = await osufile.getByte();
        //if ( osu_replay.gamemode !== GAMEMODE.MODE_TAIKO ) return {error: `Реплей не из тайко`};

        osu_replay.gameversion = await osufile.getInt();

        osu_replay.beatmap_md5 = await osufile.getString();

        osu_replay.playername = await osufile.getString();
        osu_replay.replay_md5 = await osufile.getString();

        var replayFromCache = await loadReplayCache(osu_replay.replay_md5);

        if (replayFromCache){
            await osufile.closeFile();
            //console.log("реплей есть в кэше")
            return replayFromCache;
        };

        osu_replay.count300 = await osufile.getShort();
        osu_replay.count100 = await osufile.getShort();
        osu_replay.count50 = await osufile.getShort();
        osu_replay.countGeki = await osufile.getShort();
        osu_replay.countKatu = await osufile.getShort();
        osu_replay.countMiss = await osufile.getShort();

        osu_replay.scores = await osufile.getInt();
        osu_replay.combo = await osufile.getShort();
        osu_replay.isFC = await osufile.getByte();
        osu_replay.mods = await osufile.getInt();

        let lifebar = {};
        lifebar.rawdata = await osufile.getString();
        lifebar.data = parsePeppyString(lifebar.rawdata);

        osu_replay.date = await osufile.getInt64();

        let replay_data_length = await osufile.getInt();
        let replay_data_buffer = await osufile.getStringBytes(replay_data_length);

        osu_replay.onlineid = await osufile.getLong();

        osu_replay.aditional = await osufile.getDouble();

        await osufile.closeFile();
        
        if (!osu_replay.onlineid || osu_replay.onlineid == 0){
            log('Оффлайн реплей','osu replay parse')
            return {error: `Оффлайн реплей?`};
        }

        if (!await checkTokenExpires('osu')){
            return {error: `Невозможно соединиться с пеппи... Муси муси?`};;
        };

        let score_details = await v2.scores.details(osu_replay.onlineid, GAMEMODE.mode_to_text(Number(osu_replay.gamemode)));

        if (score_details == undefined || score_details.error){
            return {error: `Реплей был из оффлайна?`};
        } else {
            osu_replay.pp = score_details.pp;
            osu_replay.accuracy = score_details.accuracy
            osu_replay.beatmap_max_combo = score_details.beatmap.max_combo;
            osu_replay.beatmap_length = score_details.beatmap.total_length;
            osu_replay.rank_global = score_details.rank_global;
            osu_replay.difficulty_rating = score_details.beatmap.difficulty_rating;
        }

        let beatmap_info = find_beatmap(osu_replay.beatmap_md5);
        
        if (!beatmap_info) {
            if (!osu_replay.onlineid || osu_replay.onlineid == 0){
                log('Оффлайн реплей','osu replay parse')
                return {error: `Нет карты.\nНе возможно определить карту для реплея.\nРеплей был из оффлайна?`};
            }
            log('Карта будет загружена','osu replay parse')
            let beatmap_osz_filepath = beatmap_download_exec(osu_replay.onlineid);
            if (beatmap_osz_filepath == false){
                log('Не найдена карта, будет загружена','osu replay parse')
                return {error: 'Загрузка карты неудалась.'}
            }
            log('Сохранение карты в Songs','osu replay parse')
            if(!copyOszToSongs(beatmap_osz_filepath)){
                log('Невозможно скопировать карту в Songs','osu replay parse')
                return {error: 'Сохранить карту неудалось.'}
            }
            log('Извлечение osz','osu replay parse')
            let beatmap_folder = beatmap_osz_extract(beatmap_osz_filepath);
            if (beatmap_folder == false){
                log('Извлечь osz не удалось','osu replay parse')
                return {error: 'Распаковать карту неудалось.'}
            }            
            log('Поиск карты из реплея','osu replay parse')
            let beatmap_fullpath = await beatmap_in_folder(osu_replay.beatmap_md5, osuNewBeatmapDir, beatmap_folder);
            if (beatmap_fullpath == undefined){
                log('Карта не найдена','osu replay parse')
                return {error: 'Не найдена карта в папке'}
            }
            log('Считывание карты','osu replay parse')
            beatmap_info = readLocalBeatmap(`${process.cwd()}/${osuNewBeatmapDir}`, beatmap_fullpath);
            add_new_beatmaps([beatmap_info]);
        }
        
        osu_replay.replay = {};

        let replay_framedata = parsePeppyString(await osufile.getLZMAString(replay_data_buffer));
       
        osu_replay.replay.dataFramesLength = replay_framedata.length;

        osu_replay.mods = calculateMods(osu_replay.mods);

        calculateKeyHits(osu_replay, replay_framedata);

        calculateNotesHits(osu_replay, beatmap_info); 

        if (!osu_replay.error){
             //save
            await saveReplayCache(osu_replay);
        }

        return osu_replay;

    } catch (e){
        console.log('error ',e);
        return {error: 'Испорченый реплей.'};
    }
}

function calculateKeyHits(osu_replay, replay_framedata){

    //расчет фреймтаймов
    var frametimes = [];
    for (let frame of replay_framedata){
        if (frame.length < 4 || Number(frame[0]) < 0 ) {
            continue;
        }
        let i = frametimes.findIndex(val=>val.value === Number(frame[0]));
        if (i == -1){
            frametimes.push({value: Number(frame[0]), count: 1});
        } else {
            frametimes[i].count++;
        }
    }

    frametimes.sort((a,b) => a.count - b.count);

    osu_replay.replay.frametimeAvg = 0;
    for (let frame of frametimes){
        frame.percent = frame.count/replay_framedata.length;
        osu_replay.replay.frametimeAvg += frame.value * frame.percent;
    }
    osu_replay.replay.frametimeAvg = osu_replay.replay.frametimeAvg.toFixed(2);


    let frametimescounts = frametimes.reduce(function(prev, current) {
        return (prev.count > current.count) ? prev : current
    }); 

    osu_replay.replay.frametimeMost = frametimescounts.value;
    

    //console.log(osu_replay.replay.frametime )
    
    //let framesms = frametimes.reduce((a,b)=>a+b);
    //osu_replay.replay.frametime = framesms/osu_replay.replay.dataFramesLength;

    //подсчет общего тайминга и количества нажатых клавиш
    var Timeline = [];
    var KeyCounts = {Key1: 0, Key2: 0, Key3: 0, Key4: 0};
    var KeyBuffer = {Key1: [], Key2: [], Key3: [], Key4: []};
    var timems = 0;

    for (let frame of replay_framedata){
        if (frame.length < 4) {
            continue;
        }
        let KeysBits = bitwise.byte.read(Number(frame[3])).reverse();
        timems += Number(frame[0]);

        if (KeysBits[0] === 1){
            KeyBuffer.Key1.push(timems);
        }
        if (KeysBits[0] === 0){
            if (KeyBuffer.Key1.length > 0){
                KeyCounts.Key1++;
                Timeline.push({Key: 1, timepressed: KeyBuffer.Key1});
                KeyBuffer.Key1 = [];
            }
        }

        if (KeysBits[1] === 1){
            KeyBuffer.Key2.push(timems);
        }
        if (KeysBits[1] === 0){
            if (KeyBuffer.Key2.length > 0){
                KeyCounts.Key2++;
                Timeline.push({Key: 2, timepressed: KeyBuffer.Key2});
                KeyBuffer.Key2 = [];
            }
        }

        if (KeysBits[2] === 1){
            KeyBuffer.Key3.push(timems);
        }
        if (KeysBits[2] === 0){
            if (KeyBuffer.Key3.length > 0){
                KeyCounts.Key3++;
                Timeline.push({Key: 3, timepressed: KeyBuffer.Key3});
                KeyBuffer.Key3 = [];
            }
        }

        if (KeysBits[3] === 1){
            KeyBuffer.Key4.push(timems);
        }
        if (KeysBits[3] === 0){
            if (KeyBuffer.Key4.length > 0){
                KeyCounts.Key4++;
                Timeline.push({Key: 4, timepressed: KeyBuffer.Key4});
                KeyBuffer.Key4 = [];
            }
        }

    }
    osu_replay.replay.hits = {};
    osu_replay.replay.hits.counts = KeyCounts;
    osu_replay.replay.hits.timeline = Timeline;
}

function calculateNotesHits(osu_replay, beatmap_info){
    //поиск данных по карте, загрузка нот
    let beatmap = getBeatmap(beatmap_info)
    osu_replay.lastnote = beatmap.lastnote;
    osu_replay.beatmap = {
        title: beatmap.title,
        artist: beatmap.artist,
        difficulty: beatmap.difficulty,
        beatmapID: beatmap.beatmapID,
        difficultyID: beatmap.difficultyID,
        notes_info: beatmap.notes_info
    }

    function CheckHittoNote(noteParams, playerhit, hitwindows){
        let hittime = Math.abs(noteParams.time - playerhit.timepressed[0]);
        
        //кнопка является доном
        if (noteParams.color == NOTECOLOR.DON && (playerhit.Key == KEYTYPE.DON1 || playerhit.Key == KEYTYPE.DON2)) {
            if ( hittime <= hitwindows.hit300 ){
                    return HITTYPE.hit300;
            } else {
                if ( hittime <= hitwindows.hit100 && hittime > hitwindows.hit300 ){
                    return HITTYPE.hit100;
                } else {
                    if ( hittime <= hitwindows.hit0 && hittime > hitwindows.hit100 ){
                        return HITTYPE.hit0;
                    }
                }
            }
        } 
        //кнопка является катцу
        if (noteParams.color == NOTECOLOR.KATSU && (playerhit.Key == KEYTYPE.KATSU1 || playerhit.Key == KEYTYPE.KATSU2)){
            if ( hittime <= hitwindows.hit300 ){
                return HITTYPE.hit300;
            } else {
                if ( hittime <= hitwindows.hit100 && hittime > hitwindows.hit300 ){
                    return HITTYPE.hit100;
                } else {
                    if ( hittime <= hitwindows.hit0 && hittime > hitwindows.hit100 ){
                        return HITTYPE.hit0;
                    }
                }
            }
        }
        //нажата не та кнопка
        if (noteParams.color == NOTECOLOR.DON && (playerhit.Key == KEYTYPE.KATSU1 || playerhit.Key == KEYTYPE.KATSU2)){
            return HITTYPE.hit0
        }
        if (noteParams.color == NOTECOLOR.KATSU && (playerhit.Key == KEYTYPE.DON1 || playerhit.Key == KEYTYPE.DON2)){
            return HITTYPE.hit0
        }
        return undefined;
    }

    //раасчет од
    osu_replay.OD = beatmap.OD;
    if (osu_replay.mods.includes('HardRock')){
        osu_replay.OD *= 1.4;
    }
    if (osu_replay.mods.includes('Easy')){
        osu_replay.OD /= 2;
    }

    //расчет окон наажатий
    osu_replay.hitwindows = getHitWindows( osu_replay.OD );

    osu_replay.playerhits = [];
    let playerclicks = osu_replay.replay.hits.timeline.slice();

    osu_replay.playersmisses = [];

    //проход по нотам
    for (let Note of beatmap.notes){
        if (!Note){
            continue;
        }

        //доделать

        if (Note.type !== NOTETYPE.HITCIRCLE){
            continue
        }
        let NoteHitted = false;
        let bigCount = 0;
        let bigHitresult = [];
        
        do {
            let playerclick = playerclicks.shift();
            if(typeof playerclick === 'undefined') break; //конец массива
            
            if (playerclick.timepressed[0] < Note.time - osu_replay.hitwindows.hit0){
                continue;
            }

            
            if (playerclick.timepressed[0] > Note.time + osu_replay.hitwindows.hit0){
                playerclicks.unshift(playerclick);
                if (Note.big){
                    if (bigHitresult.length==0){
                        bigHitresult = HITTYPE.hit0;
                    }
                    Note.hitresult = bigHitresult;
                } else {
                    Note.hitresult = HITTYPE.hit0;
                }
                
                NoteHitted = true;
                break;
            }

            Note.hitresult = CheckHittoNote( Note, playerclick, osu_replay.hitwindows);
            
            if (Note.hitresult){
                NoteHitted = true;
            }

            if (Note.big && NoteHitted == true){
                bigHitresult.push(Note.hitresult);
                
                bigCount++;
                if (bigCount<2){
                    NoteHitted = false;
                } else {
                    Note.hitresult = bigHitresult;
                    NoteHitted = true;
                }
            }
        } while (!NoteHitted)
        osu_replay.playerhits.push(Note);
    }
    osu_replay.playersmisses = osu_replay.playerhits.filter(val=>val.hitresult == HITTYPE.hit0 || (typeof val.hitresult == 'object' &&  val.hitresult.includes(HITTYPE.hit0)));
    
}

module.exports = {
    getReplayData: getReplayData,
}