
const { execSync } =  require('child_process');

function beatmap_download_exec(score_onlineid){
    var command = 'osu_beatmap_download.bat';
    console.log('будет загружена битмапа');
    try{
        var o = execSync(`${command} ${score_onlineid}`, {stdio: 'pipe'});
    } catch(e){
        console.log(e);
        return false;
    }
    if (Boolean(o)){
        
        var localpath = o.toString().split('\n').filter(val=>val.startsWith('localpath:'));
        if (localpath.length>0){
            var localpath_oszfile = localpath[0].split(':')[1].trim();
            console.log('карта загружена в '+localpath_oszfile);
            return localpath_oszfile;
        }
        return false;
    } else {
        return false;
    }
}

module.exports = {
    beatmap_download_exec: beatmap_download_exec,
}