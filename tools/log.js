const { getTimeMSKCurrentToStringFormat } = require('./time.js');
const { saveLog } = require('../displaydata/displaydata.js');

module.exports = {
    LogString: function(guildname, type, name, text ){

        /*guildname = typeof guildname === 'undefined'?'':guildname;
        type = typeof type === 'undefined'?'':type;
        name = typeof name === 'undefined'?'':name;
        text = typeof text === 'undefined'?'':text;*/

        var logtext = `[${getTimeMSKCurrentToStringFormat()}] (${type}) ${guildname} | ${name}: ${text}`;
        console.log(logtext);
        //console.log(text);
        
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