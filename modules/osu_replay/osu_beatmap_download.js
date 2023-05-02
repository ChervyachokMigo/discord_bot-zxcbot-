
const { v2 } = require ('osu-api-extended');

const { CreateFolderSync_IsNotExists } = require('../tools.js');

const { osuBeatmapDownloadsDir } = require('../../settings.js');

const { checkTokenExpires } = require (`../stalker/requests.js`);
const { isOsz } = require('./osu_osz_extract.js');

var argv = process.argv.slice(2);

(async ()=>{await beatmap_download(argv[0])})();

async function beatmap_download(onlineid, params){
    try{
        if (!await checkTokenExpires('osu')){
            return false;
        };

        let beatmap_details = await v2.scores.details(onlineid, 'taiko');

        if (!beatmap_details || beatmap_details == null || beatmap_details.error || !beatmap_details.beatmapset || !beatmap_details.beatmapset.id){
            
            return false
            
        }
        
        CreateFolderSync_IsNotExists(osuBeatmapDownloadsDir);
        
        function escapeString (text){
            return text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, '');
        }

        const osz_filename = `${beatmap_details.beatmapset.id} ${escapeString(beatmap_details.beatmapset.artist)} - ${escapeString(beatmap_details.beatmapset.title)}.osz`;
        const downloadpath = `${osuBeatmapDownloadsDir}\\${osz_filename}`;
        
        if (isOsz(downloadpath)){
            console.log('localpath:',downloadpath)
            return(downloadpath); 
        }

        var download_result = await v2.beatmap.download(beatmap_details.beatmapset.id, downloadpath);

        if(typeof download_result === 'undefined' || download_result.error){
            return false
        }

        console.log('localpath:',download_result)
        return(download_result);   
    } catch(e){
        return false
    }
}
