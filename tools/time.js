module.exports = {
    WindowsTicksToUTC: function (d){
        return d / 10000 - 62135596800000;
    }, 
    
    formatSecondsToTime:function (d){
        let d_sec = module.exports.formatAddZero(Math.floor(d % 60))
        let d_min = module.exports.formatAddZero(Math.floor(d /60 % 60))
        let d_hour = module.exports.formatAddZero(Math.floor(d / 3600))
        return `${d_hour}:${d_min}:${d_sec}`
    },

    getTimeMSKCurrentToStringFormat: function(){
        let timemsg = module.exports.getMoskowDate(module.exports.getCurrentTimeMs())
        timemsg = `${module.exports.formatAddZero(timemsg.getUTCHours())}:${module.exports.formatAddZero(timemsg.getUTCMinutes())} ${module.exports.formatAddZero(timemsg.getUTCDate())}/${(module.exports.formatAddZero(timemsg.getUTCMonth()+1))}`
        return `${timemsg}`
    },

    getTimeMSKToStringFormat: function(time){
        let timemsg = module.exports.getMoskowDate(time.valueOf())
        timemsg = `${module.exports.formatAddZero(timemsg.getUTCHours())}:${module.exports.formatAddZero(timemsg.getUTCMinutes())} ${module.exports.formatAddZero(timemsg.getUTCDate())}/${(module.exports.formatAddZero(timemsg.getUTCMonth()+1))}/${(module.exports.formatAddZero(timemsg.getUTCFullYear()))}`
        return `${timemsg}`
    },

    getFullTimeMSKFileSafety: function(time){
        let timemsg = module.exports.getMoskowDate(time.valueOf());
        var timetext = `${(module.exports.formatAddZero(timemsg.getUTCFullYear()))}-`;
        timetext += `${(module.exports.formatAddZero(timemsg.getUTCMonth()+1))}-`;
        timetext += `${module.exports.formatAddZero(timemsg.getUTCDate())} `;
        timetext += `${module.exports.formatAddZero(timemsg.getUTCHours())}h`;
        timetext += `${module.exports.formatAddZero(timemsg.getUTCMinutes())}m`;
        timetext += `${module.exports.formatAddZero(timemsg.getUTCSeconds())}s`;
        return timetext;
    },

    getDiscordRelativeTime: function (dateString){
        return `<t:${Math.trunc(new Date(dateString).getTime()/1000)}:R>`;
    },

    getMoskowDate: function(timestamp){
        return new Date(timestamp+10800000)
    },

    getCurrentTimeMs: function(){
        return new Date().valueOf()
    },

    formatAddZero: function(t) {
        return t < 10 ? '0' + t : t;
    },

    getYMD: function (date = new Date()){
        var text = `${date.getFullYear()}-${module.exports.formatAddZero(date.getMonth()+1)}-${module.exports.formatAddZero(date.getDate())}`;
        return text;
    },

    timeAgo: function (time_agoSecs){
        //var dateAgo = new Date(new Date().valueOf()-time_agoSecs);
        var timesec = time_agoSecs%60;
        var timemin = Math.trunc(time_agoSecs/60)%60;
        var timehour = Math.trunc(time_agoSecs/3600)%24;
        var timeday = Math.trunc(time_agoSecs/86400);
        var res = '';
        res += timeday>0?`${timeday} дней `:'';
        res += timehour>0?`${timehour} часов `:'';
        res += timemin>0?`${timemin} минут `:'';
        res += timesec>0?`${timesec} секунд`:'';
        return res;
    },

    formatTime: function(timeSec){
        const timeMin = Math.trunc(timeSec / 60);
        if (timeSec < 1) return 'Завершено';
        if (timeSec < 60) return 'менее 1 минуты';
    
        const days = Math.trunc(timeMin / 1440);
        const hours = Math.trunc(timeMin / 60) % 24;
        const minutes = timeMin % 60;
    
        const daysText = days === 1 ? 'день' : days >= 2 && days <= 4 ? 'дня' : 'дней';
        const hoursText = hours === 1 ? 'час' : hours >= 2 && hours <= 4 ? 'часа' : 'часов';
        const minutesText = minutes === 1 ? 'минуту' : minutes >= 2 && minutes <= 4 ? 'минуты' : 'минут';
    
        return `${days > 0 ? `${days} ${daysText} ` : ''}${hours > 0 ? `${hours} ${hoursText} ` : ''}${minutes} ${minutesText}`;
    },
}