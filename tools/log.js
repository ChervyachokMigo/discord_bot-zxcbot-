const { getTimeMSKCurrentToStringFormat } = require('./time.js');
const { saveLog } = require('../logserver/displaydata.js');

module.exports = {
    LogString: function(guildname, type, name, text ){

        var logtext = `[${getTimeMSKCurrentToStringFormat()}] (${type}) ${guildname} | ${name}: ${text}`;
        console.log(logtext);
        
        saveLog(logtext);
    },

    log: function (info, title = `Stalker`){
        module.exports.LogString(`System`,`info`, title, info);
    },
    
    debug: function (text = ''){
        console.log(text)
        throw new Error('stop point');
    },

}