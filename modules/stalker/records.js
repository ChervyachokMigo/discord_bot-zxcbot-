const {spawn} = require('child_process');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path')
const player = require('play-sound')(opts = {player:'mplayer'});

const { getYMD, getFullTimeMSKFileSafety } = require("../../tools/time.js");
const { LogString } = require("../../tools/log.js");
const { CreateFolderSync_IsNotExists } = require('../../modules/tools.js');

const { stalkerClipsFolder, stalkerRecordsRoot } = require('../../settings.js');

const moduleName = `Stalker Stream Records`;

var recording = {
    twitch: {
        users: []
    },
    trovo: {
        users: []
    },
}

var fixingfiles = [];

function isProcessing(){
    var isRecording = recording.twitch.users.find((val)=>val.value == true) || recording.trovo.users.find((val)=>val.value == true);
    var isFixing = fixingfiles.length>0;
    return isRecording || isFixing;
}

function setrecording(platform, username, value){
    var idx = recording[platform].users.findIndex((val) => {
        return val.username === username
    });
    if (idx == -1){
        recording[platform].users.push({username: username, value: value})
    } else {
        recording[platform].users[idx].value = value;
    }
}

function getrecording(platform, username){
    var idx = recording[platform].users.findIndex((val) => {
        return val.username === username
    });
    var result = false;
    if (idx == -1){
        recording[platform].users.push({username: username, value: result})
    } else {
        result = recording[platform].users[idx].value;
    }
    return result;
}

async function VideoDirectoryCheck(user, platform, stalkerEvents){
    if (getrecording(platform, user.username) == true) return

    var recorded_path = `${stalkerRecordsRoot}\\${platform}\\recorded\\${user.username}`;
    var processed_path = `${stalkerRecordsRoot}\\${platform}\\processed\\${user.username}`;

    //create directory for recordedPath and processedPath if not exist
    if(!CreateFolderSync_IsNotExists(recorded_path)){ return }
    if(!CreateFolderSync_IsNotExists(processed_path)){ return }

    var trackingsGuilds = await getGuildidsOfTrackingUserService(`${platform}_records`, user.userid);
                    
    return new Promise(async (res,rej)=>{
        //fix videos from previous recording session
        try {
            let videofiles = await fsPromises.readdir(recorded_path);
            for (let video of videofiles){
                if (path.extname(video)==='.mp4'){
                    let videopath = `${recorded_path}\\${video}`;
                    if (fixingfiles.indexOf(videopath) == -1){
                        try{
                            fs.open(videopath, 'r+', function(err, fd){
                                if (err){
                                    console.log(err)
                                }
                                if (err && err.code === 'EBUSY'){
                                    //do nothing till next loop
                                    console.log(videopath, 'is EBUSY')
                                } else {
                                    fs.close(fd, async function(){
                                        var result = await FixVideo(`${recorded_path}\\${video}`, `${processed_path}\\${video}`);
                                        stalkerEvents.emit('StreamRecord', {guildids: trackingsGuilds, action: 'fix', text: result, platform: platform})
                                    });
                                }
                            });
                            
                        } catch (e){
                            console.log(e)
                        }
                    }
                }
            }
            res(true)
        } catch (err) {
            rej(err)
        }
    })
    
}

async function FixVideo(pathfrom, pathto){
    var videoname = path.basename(pathfrom);
    return new Promise((res,rej)=>{
        LogString('System','info',moduleName,`fixing ${videoname}`);
        var proc = spawn(`ffmpeg`, [
            `-err_detect`, 
            `ignore_err`,
            `-i`, pathfrom,
            `-c`, `copy`,
            `-y`,
            pathto]);
        fixingfiles.push(pathfrom);
        proc.on('error', (err) => console.log(err));
        
        proc.stderr.on('error', (err) => console.log(err));
        proc.stdout.on('error', (err) => console.log(err));

        proc.stdout.on('data', (data)=>{
            //console.log(data)
        });
        proc.stderr.on('data', (data)=>{
            //console.log(data)
        });

        proc.on('close', (code) => {
            fixingfiles.splice(fixingfiles.indexOf(pathfrom), 1);
            if (code==0){
                try{
                    fs.rmSync(pathfrom);
                    LogString('System','info', moduleName, `${videoname} fixed.`);
                    res(`**${videoname}** fixed.`);
                } catch (e){
                    rej(e);
                }
            } else {
                rej(`child process exited with code ${code}`)
            }
        });
    });
}

async function StartRecording(user, platform, stalkerEvents){

    if (getrecording(platform, user.username) == true) return

    var recordto = `${stalkerRecordsRoot}\\${platform}\\recorded\\${user.username}`;
    var startdate = getFullTimeMSKFileSafety(new Date());
    var title = user.title.replace(/[^А-яЁёA-z0-9 ]/g,'');
    var videoname = `${user.username} - ${startdate} - ${title}.mp4`;

    var processArgs = [];

    switch (platform){
        case 'twitch':
            processArgs = [
                'https://twitch.tv/'+user.username,
                `best`,
                `-o`,`${recordto}\\${videoname}`,
                `--twitch-disable-ads`];
            break
        case 'trovo':
            processArgs = [
                'https://trovo.live/s/'+user.username,
                `best`,
                `--output`,`${recordto}\\${videoname}`];
            break
        default:
            LogString('System','Error',moduleName,`unknown platform to start recording`);
            return false
    }

    setrecording(platform, user.username, true);

    player.play('streamstart.mp3');

    var proc = spawn(`streamlink`, processArgs);   

    LogString('System','info',moduleName,`начало записи: ${videoname}`);
    var trackingsGuilds = await getGuildidsOfTrackingUserService(`${platform}_records`, user.userid);
    stalkerEvents.emit('StreamRecord', {guildids: trackingsGuilds, action: 'start', name: videoname, platform: platform });

    proc.on('close', (code) => {

        if (code==0 || code==1){
            LogString('System','info',moduleName, `завершена запись ${user?.username}: ${videoname}`);
            stalkerEvents.emit('StreamRecord', {guildids: trackingsGuilds, action: 'stop', name: videoname, platform: platform});
        } else {
            console.log(`child process exited with code ${code}`);
        }
        setrecording(platform, user.username, false);
    }); 
}

async function DownloadClip (clipdata, platform){
    switch (platform){
        case 'twitch':
            return new Promise(async(res,rej)=>{
                clipdata.title = clipdata.title.replace(/[^А-яЁёA-z0-9 ]/g,'');
                var output_folder = `${stalkerClipsFolder}\\${platform}\\${clipdata.broadcaster_name}\\${getYMD(new Date(clipdata.created_at))}`;
        
                var input = clipdata.url;
                var output = `${output_folder}\\${clipdata.id}_${clipdata.title}_${clipdata.creator_name}.mp4`;
                
                if(!CreateFolderSync_IsNotExists(output_folder)){ rej(false) }
        
                try{
                    LogString('System','info',moduleName,`Создан новый файл: ${output}`);
                    var proc = spawn(`.\\batches\\download_clip.bat`, [input, output]);
                    proc.on ('stdio', (d)=>{
                        console.log(d);
                    });
                    proc.on ('stdout', (d)=>{
                        console.log(d);
                    });
                    proc.on ('stderr', (d)=>{
                        console.log(d);
                    });
                    proc.on('close', (code) => {
                        res(code);
                    });
                    
                   
                } catch(e){
                    LogString(`System`, `Error`, moduleName, e);
                    rej(e)
                }
            });
            break
        case 'trovo':
            return new Promise(async(res,rej)=>{
                clipdata.title = clipdata.title.replace(/[^А-яЁёA-z0-9 ]/g,'');
                var output_folder = `${stalkerClipsFolder}\\${platform}\\${clipdata.streamer_username}\\${getYMD()}`;
        
                var input = clipdata.url;
                var output = `${output_folder}\\${clipdata.clip_id}_${clipdata.title}_${clipdata.maker_username}.mp4`;
                
                if(!CreateFolderSync_IsNotExists(output_folder)){ rej(false) }
        
                try{
                    var proc = spawn(`.\\batches\\download_clip_trovo.bat`, [input, output]);
                    proc.on('close', (code) => {
                        res(code);
                    });
                } catch(e){
                    LogString(`System`, `Error`, moduleName, e);
                    rej(e)
                }
            });
            break
        default:
            LogString(`System`, `Error`, moduleName, 'Clips: unknown platform');
            return false
    }
    
}

module.exports = {
    StartRecording: StartRecording,
    FixVideo: FixVideo,
    VideoDirectoryCheck: VideoDirectoryCheck,
    DownloadClip: DownloadClip,
    isProcessing: isProcessing,
}