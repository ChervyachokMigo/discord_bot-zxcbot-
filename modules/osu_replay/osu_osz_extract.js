const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const { log } = require("../../tools/log.js");
const { CreateFolderSync_IsNotExists } = require('../tools.js');

const { osuBeatmapDownloadsDir, osuNewBeatmapDir, osuPath } = require('../../settings.js');

function beatmap_osz_extract(osz_filename){
    try{
        osz_filename = path.basename(osz_filename).trim();
        var ExtractedLocalPath = ExtractOSZ(osz_filename);
        
        if (ExtractedLocalPath == undefined){
            return false;
        }
        log('Новая карта распакована в '+ExtractedLocalPath, 'beatmap osz extract')
        return ExtractedLocalPath;
    } catch(e){
        console.log(e);
        return false
    }
}

function ExtractOSZ(filename){
    var path_from = `${osuBeatmapDownloadsDir}/${filename}`;
    var path_to = `${osuNewBeatmapDir}/${path.basename(filename, path.extname(filename))}`;

    var command = `7z/7za.exe`;
    var args2 = [ `x`,
        `-y`,
        `${path_from}`, 
        `-o${path_to}`
    ];

    CreateFolderSync_IsNotExists(osuBeatmapDownloadsDir);
    CreateFolderSync_IsNotExists(path_to);

    var o = spawnSync(command, args2);

    if (o && o.error && o.error.code){
        log ('Ошибка распаковки '+o.error.code);
        return undefined
    }
    if (Boolean(o)){
        return(path.basename(filename, path.extname(filename)));
    } else {
        return(undefined);
    }
}

function isOsz(osz_path){
    if (path.extname(osz_path)==='.osz'){
        try{
            var stats = fs.statSync(osz_path);
            if(stats.size < 3000){  //если файл скачался то скорей всего он больше 3 килобайт
                let jsondata = fs.readFileSync(osz_path, {encoding:`utf-8`});
                let jsonparsed = JSON.parse(jsondata);
                log(jsonparsed.error.toString())
                fs.unlinkSync(osz_path);
                return false;
            } else {
                return true;
            }
        } catch (e){
            console.log(e)
            return false;
        }
    } else {
        return false;
    }
}

function copyOszToSongs(path_from){
    try{
        path_from = path_from.trim();
        path_to = `${osuPath}/Songs`;

        if (isOsz(path_from)){
            let osz_filename = path.basename(path_from);
            fs.copyFileSync(path_from, `${path_to}/${osz_filename}`);
            log('Копия карты сделана в папку Songs/'+osz_filename);
            return true
        }    
    } catch (e){
        console.log(e);
        return false
    }
}


module.exports = {
    beatmap_osz_extract: beatmap_osz_extract,
    isOsz: isOsz,
    copyOszToSongs: copyOszToSongs,
}