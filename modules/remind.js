
const { MYSQL_SAVE, MYSQL_GET_ALL, MYSQL_DELETE } = require("./DB/base.js");

const { checkArgsOfValue } = require("./tools")
const { getGuildChannelDB } = require (`./GuildChannel.js`)

const { LogString } = require("../tools/log.js")
const { formatTime, getCurrentTimeMs } = require("../tools/time.js")
const { SendAnswer, SendError } = require("../tools/embed.js")

var Timers = [];

module.exports = {
    RemindCommandAction: async function( comargs, message, com_text ){
        var firstArg = await comargs.shift();

        if (!firstArg){
            //показать все
            var reminddb = await MYSQL_GET_ALL(`remind`, { guildid: message.guild.id, messageid: message.author.id } )
            var reminds_out = [];            
            
            if (reminddb.length > 0){
                for (var r of reminddb){
                    reminds_out.push(module.exports.formatRemind (r.dataValues) )
                }
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:   `${message.author.username}, у вас есть напоминания`,
                    mentionuser:  `${message.author}`,
                    fields:  reminds_out} );
            } else {
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:   `У вас нет напоминаний`,
                    mentionuser:  `${message.author}`} );
            }
            return
        }
        firstArg = firstArg.toLowerCase()
        //очистить все
        if (firstArg === 'clear') {
            await module.exports.RemindsClear(message)
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `${message.author}, напоминания очищены`,
                mentionuser:  `${message.author}`} );
            return
        }
        //запись нового
        var remindType = firstArg
        if (!remindType) return
        if (remindType !== 'infinity' && remindType !== 'once'){
            await SendError(message, com_text, `Не указан тип напоминания (**infinity** или **once**)`);
            return
        }
        var remindTimeMin = await checkArgsOfValue ( comargs.shift() , com_text, message)
        if (!remindTimeMin) return
        if (remindTimeMin < 1) {
            await SendError(message, com_text, `Нельзя постаавить меньше одной минуты`);
            return
        }
        if (remindTimeMin > 35791) {    //максимум инт 32 бита, таймер больше не поставить
            await SendError(message, com_text, `Время слишком большое. Нельзя поставить больше 35791 минут`);
            return
        }

        if (typeof comargs[0] === 'undefined') {
            await SendError(message, com_text, `Нужно ввести описание`);
            return
        }
        
        var remindText = await comargs.join(" ").replace(/"/gui,'')
        if (!remindText) return

        
        if (remindText.length>255) {
            remindText = remindText.substring(0,255)
        }
        
        var newremind = module.exports.CreateRemind(  message.guild.id , message.author.id, remindType==='infinity'?true:false, 
            getCurrentTimeMs()+remindTimeMin*60000, remindTimeMin, remindText)

            var mysql_newremind = await MYSQL_SAVE(`remind`,
            {guildid: newremind.guildid, 
                userid: newremind.userid, 
                text: newremind.text}, 
            {time: newremind.time,
            timeMin: newremind.timeMin,
            infinity: newremind.infinity})
        if (mysql_newremind){
            mysql_newremind = mysql_newremind.dataValues
            newremind.id = mysql_newremind.id
            await module.exports.RemindTimerStart (message.guild, newremind)
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `Создано новое напоминание:`,
                mentionuser:  `${message.author}`,
                fields: [module.exports.formatRemind(newremind)]} );

        }
    },

    StartAllRemindes: async function( guild ) {
        var reminddb = await MYSQL_GET_ALL(`remind`, { guildid: guild.id } )
        if (!reminddb) return
        if (reminddb.length == 0) return

        reminddb = reminddb
        for (var remind_db_item of reminddb){
            await module.exports.RemindTimerStart ( guild, remind_db_item.dataValues )
        }
        LogString(guild.name, `info`, `Remind`, `Загружены и запущены все напоминания`)
    },

    CreateRemind: function(guildid ,userid, infinity, time, timeMin, text){
        return {
            guildid: guildid,
            userid: userid,
            infinity: infinity,
            time: time,
            timeMin: timeMin,
            text: text}
    },

    RemindTimerStart: async function (guild, remind_val){
        var timeMs = remind_val.time - getCurrentTimeMs()
        var channel = await getGuildChannelDB(guild, `reminds`)

        if (!channel) {
            await SendAnswer( {channel: channel,
                guildname: guild.name,
                messagetype: `Error`,
                title: 'Reminds',
                text:   `Не назначен канал для напоминаний и не назначен системный канал! Напоминания будут отключены.`} );
            return
        }
        Timers.push(
            {
                userid: remind_val.userid, 
                id: remind_val.id, 
                timer: setTimeout(async () => {
                    await SendAnswer( {channel: channel,
                        guildname: guild.name,
                        messagetype: `info`,
                        title: 'Reminds',
                        text:   remind_val.text,
                        mentionuser:  `\<@!${remind_val.userid}>`} );
                    if (remind_val.infinity === true){
                        await module.exports.UpdateTimeRemind(guild, remind_val)
                    } else {
                        await module.exports.RemoveRemind(guild, remind_val)
                    }
                }, timeMs )
            })
    },

    formatRemind: function (remindObj){
        var timeSec = (remindObj.time-getCurrentTimeMs())/1000
        var format_time = formatTime (timeSec)
        if (timeSec > 0){
            format_time = `через ${format_time}`
            if (remindObj.infinity === true){
                format_time = `${format_time} (бесконечно)`
            } else {
                format_time = `${format_time} (один раз)`
            }
        }
        
        return {name: `${remindObj.text}`, value: format_time}
    },

    RemindsClear: async function (message){
        for (var i = 0; i < Timers.length; i++){
            if ( i < 0 ) i = 0
            if (Timers.length == 0) break
            if (Timers[i].userid == message.author.id) {
                if (Timers[i].timer){
                    clearInterval(Timers[i].timer);
                    Timers.splice(i,1)
                    i--
                }
            }
        }
        await MYSQL_DELETE('remind',{guildid: message.guild.id, userid: message.author.id})
    },

    RemoveRemind: async function(guild, reminddb){
        for (var i = 0; i < Timers.length; i++){
            if (Timers[i].id == reminddb.id){
                if (Timers[i].timer){
                    Timers.splice(i,1)
                    break
                }
            }
        }
        await MYSQL_DELETE('remind', {guildid: reminddb.guildid, userid:  reminddb.userid, id: reminddb.id})
    },

    UpdateTimeRemind: async function( guild, reminddb ){
        if (!reminddb) return
        if (reminddb.length == 0) return
        for (var k = 0; k < Timers.length; k++){
            if (Timers[k].id == reminddb.id){
                if (Timers[k].timer){
                    Timers.splice(k,1)
                    break
                }
            }
        }      
                
       reminddb.time = getCurrentTimeMs()+reminddb.timeMin*60000   
       await module.exports.RemindTimerStart (guild, reminddb)

        var mysql_newremind = await MYSQL_SAVE(`remind`,
            {guildid: reminddb.guildid, 
                userid: reminddb.userid, 
                id: reminddb.id}, 
            {time: reminddb.time})

    }
}