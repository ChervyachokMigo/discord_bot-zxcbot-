
const { MYSQL_SAVE, MYSQL_GET_ONE } = require("mysql-tools");

var beatmaps_cached = [];
var ReplaysCache = [];
var UserAttachmentsCache = [];

function loadCachedBeatmap(beatmap_md5){
    let beatmap = beatmaps_cached.filter(val=>val.beatmap_md5 === beatmap_md5).shift();
    if (typeof beatmap !== 'undefined'){
        return beatmap;
    } else {
        return false;
    }
}

function saveBeatmapToCache(data){
    beatmaps_cached.push(data);
}

async function loadReplayCache(replay_md5){
    var foundedReplay = ReplaysCache.filter(val=>val.replay_md5 === replay_md5);
    if (foundedReplay.length>0){
        return foundedReplay[0]
    } else {
        const mysql_replay = await MYSQL_GET_ONE( 'replaycache', {replay_md5} )
        if (mysql_replay !== null){
            //реплей есть в базе
            const osu_replay = JSON.parse(mysql_replay.replayJSONdata);
            ReplaysCache.push(osu_replay);
            return osu_replay;
        } else {
            return false;
        }
    }
}

async function saveReplayCache(osu_replay){
    ReplaysCache.push(osu_replay);
    await MYSQL_SAVE('replaycache', { replay_md5: osu_replay.replay_md5 , replayJSONdata: JSON.stringify(osu_replay) });
}

async function saveAttachmentCache(dataObj){
    //dataObj {imageid, userid, beatmapid, replayid, time, zoom}
    UserAttachmentsCache.push(dataObj);
    await MYSQL_SAVE('replayattachment', {
		imageid: dataObj.imageid, 
        userid: dataObj.userid, 
        beatmap_md5: dataObj.beatmapid,
        replay_md5: dataObj.replayid, 
        time: dataObj.time,  
        zoom: dataObj.zoom
    });
}

async function loadAttachmentCache(imageid, userid){

    let attachment = UserAttachmentsCache.filter(val=>val.imageid === imageid).shift();

    if (typeof attachment !== 'undefined')
        return attachment;

    attachment = await MYSQL_GET_ONE( 'replayattachment', {imageid} );
    if (attachment !== null){
        attachment = {
            ...attachment,
            imageid, 
            userid, 
            beatmapid: attachment.beatmap_md5, 
            replayid: attachment.replay_md5, 
            time: attachment.time, 
            zoom: attachment.zoom};
        UserAttachmentsCache.push(attachment);
        return attachment;
    }
    return undefined;
}

module.exports = {
    loadCachedBeatmap: loadCachedBeatmap,
    saveBeatmapToCache: saveBeatmapToCache,
    loadReplayCache: loadReplayCache,
    saveReplayCache: saveReplayCache,
    loadAttachmentCache: loadAttachmentCache, 
    saveAttachmentCache: saveAttachmentCache
}