module.exports = {
    WindowsTicksToUTC: function (d){
        return d / 10000 - 62135596800000;
    }, 
    
    formatSecondsToTime:function (d){
        let d_sec = formatAddZero(Math.floor(d % 60), 2);
        let d_min = formatAddZero(Math.floor(d /60 % 60), 2);
        let d_hour = formatAddZero(Math.floor(d / 3600), 2);
        return `${d_hour}:${d_min}:${d_sec}`;
    },

    getTimeMSKCurrentToStringFormat: function(){
        let timemsg = module.exports.getMoskowDate(module.exports.getCurrentTimeMs());
        const hours = formatAddZero(timemsg.getUTCHours(), 2);
        const minutes = formatAddZero(timemsg.getUTCMinutes(), 2);
        const day = formatAddZero(timemsg.getUTCDate(), 2);
        const month = formatAddZero(timemsg.getUTCMonth()+1, 2);
        return `${hours}:${minutes} ${day}/${month}`;
    },

    getTimeMSKToStringFormat: function(time){
        let timemsg = module.exports.getMoskowDate(time.valueOf());
        const hours = formatAddZero(timemsg.getUTCHours(), 2);
        const minutes = formatAddZero(timemsg.getUTCMinutes(), 2);
        const day = formatAddZero(timemsg.getUTCDate(), 2);
        const month = formatAddZero(timemsg.getUTCMonth()+1, 2);
        const year = formatAddZero(timemsg.getUTCFullYear(), 4);
        return `${hours}:${minutes} ${day}/${month}/${year}`;
    },

    getFullTimeMSKFileSafety: function(time){
        let timemsg = module.exports.getMoskowDate(time.valueOf());
        const year = formatAddZero(timemsg.getUTCFullYear(), 4);
        const month = formatAddZero(timemsg.getUTCMonth()+1, 2);
        const day = formatAddZero(timemsg.getUTCDate(), 2);
        const hours = formatAddZero(timemsg.getUTCHours(), 2);
        const minutes = formatAddZero(timemsg.getUTCMinutes(), 2);
        const seconds = formatAddZero(timemsg.getUTCSeconds(), 2);
        return `${year}-${month}-${day} ${hours}h${minutes}m${seconds}s`;
    },

    getDiscordRelativeTime: function (dateString){
        return `<t:${Math.trunc(new Date(dateString).getTime()/1000)}:R>`;
    },

    getMoskowDate: function(timestamp){
        return new Date(timestamp+10800000);
    },

    getCurrentTimeMs: function(){
        return new Date().valueOf();
    },

    getYMD: function (date = new Date()){
        return `${date.getFullYear()}-${formatAddZero(date.getMonth()+1, 2)}-${formatAddZero(date.getDate(), 2)}`;
    },

    timeAgo: function (time_agoSecs){
        //var dateAgo = new Date(new Date().valueOf()-time_agoSecs);
        const timesec = time_agoSecs % 60;
        const timemin = Math.trunc(time_agoSecs / 60) % 60;
        const timehour = Math.trunc(time_agoSecs / 3600) % 24;
        const timeday = Math.trunc(time_agoSecs / 86400);

        const days = timeday > 0 ? `${timeday} дней `: '';
        const hours = timehour > 0 ? `${timehour} часов `: '';
        const minutes = timemin > 0 ? `${timemin} минут `: '';
        const seconds = timesec > 0 ? `${timesec} секунд`: '';
        return `${days}${hours}${minutes}${seconds}`;
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

    formatAddZero: formatAddZero,
}

function formatAddZero (t, symbols = 1) {
    var result = t.toString();
    var numberLength = t.toString().length;
    if ( result.length < symbols){
        for (var i = 0; i < symbols-numberLength; i++){
            result = `0${result}`;
        }
    }
    return result;
}