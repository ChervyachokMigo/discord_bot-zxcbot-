const { daily_WaitTime, coins_daily_reward, coins_name, coins_max } = require("../settings.js")
const { getGuildChannelDB } = require (`./GuildChannel.js`)

const { formatSecondsToTime, getCurrentTimeMs } = require("../tools/time.js")

const { CheckUser } = require("./DB_tools.js")

const {  MYSQL_SAVE, MYSQL_GET_ALL } = require("./DB.js")

const { LogString } = require("../tools/log.js")
const { SendAnswer } = require("../tools/embed.js")

var DailyTimers = [];

const daily_waittime_ms = daily_WaitTime*1000

module.exports = {
    getDailyTimeLeftMs: function(lastdaily){
        var currentTime = getCurrentTimeMs()
        var diff = currentTime - lastdaily
        return daily_waittime_ms - diff
    },

    dailyesTimers_onStart: async function ( guild ){
        var usersdaily = await MYSQL_GET_ALL ( `daily`, { guildid: guild.id } )
        if (usersdaily.length > 0){
            for (var i= 0; i < usersdaily.length; i++){
                if (usersdaily[i].dataValues.dailynotified == false){
                    await module.exports.dailyCreateTimer(
                        guild, usersdaily[i].dataValues.userid, usersdaily[i].dataValues.lastdaily)
                    
                }
            }
        }
        LogString(guild.name, `info`, `Balance Daily`, `Загружены и запущены все дейлики`)
    },

    dailyCommandAction: async function( message, com_text ){
        //проверяем данные если таймлефт меньше нуля то выдаем деньги, если больше пишем что еще не все.
        //если выдали деньги ставим таймер на следуюший, записываем в базу изменения, 
        // если нет то проверяем есть ли таймер
        //когда таймер сработал выключаем оповещение
        //при старте загрузить все таймеры у которых оповещение еще не пришло
        //если юзер не запускал команду то у него и не будет записи в базе, и не будет оповещения

        var userdb = await CheckUser( message.channel, message.author.id)

        //проверить существующий
        if (!await module.exports.isTimeOver( message.guild, message.author.id, userdb.lastdaily)){
            let DailyTimeLeft = module.exports.getDailyTimeLeftMs(userdb.lastdaily)
            let date_text =  formatSecondsToTime( DailyTimeLeft /1000 )
            
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:  `Тебе осталось ждать **${date_text}**`,
                mentionuser:  `${message.author}` } );
            return
        }
        
        //если таймер откатился
        var newuuserdb = {}
        newuuserdb.lastdaily = getCurrentTimeMs()
        var coins_daily_reward_text = coins_daily_reward
        if (userdb.coins + coins_daily_reward >= coins_max){
            coins_daily_reward_text = coins_max - userdb.coins
            newuuserdb.coins = coins_max
        } else {
            newuuserdb.coins = userdb.coins + coins_daily_reward
        }
        
        newuuserdb.dailynotified = false
        
        await module.exports.dailyCreateTimer(
            message.guild, message.author.id, newuuserdb.lastdaily)
            
        if (await MYSQL_SAVE( `user`, 
            {guildid: message.guild.id, userid:message.author.id },
            {coins: newuuserdb.coins, lastdaily: newuuserdb.lastdaily, dailynotified: newuuserdb.dailynotified })){
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:  `${message.author.username}, тебе дали **${coins_daily_reward_text} ${coins_name}**`,
                    mentionuser:  `${message.author}` });
        }
    },
    
    dailyCreateTimer: async function( guild, userid, lastdailyTimestamp ){

        if (!guild.member.fetch(userid)) {
            console.log('невозможно создать таймер, нет юзера')
            return
        }

        //проверить существующий
        for (var dailytimer of DailyTimers){
            if (dailytimer.guildid === guild.id && dailytimer.userid === userid){
                return false    //таймер уже есть
            }
        }

        var newDailyTimerParams = module.exports.DailyParameters( 
            guild.id,
            userid,
            lastdailyTimestamp,
            setTimeout(
                async () => {
                        
                        var channel = await getGuildChannelDB( guild , `daily` )
                        await SendAnswer( {channel: channel,
                            guildname: guild.name,
                            messagetype: `info`,
                            title: 'Balance Daily Remind',
                            text:  `\<@!${userid}>, У тебя откатился дейлик, приди, возьми! `,
                            mentionuser:  `\<@!${userid}>` } );
                        await module.exports.removeOldTimers()
                        await module.exports.DB_Daily_SetNotified( guild, userid )
                    }, module.exports.getDailyTimeLeftMs( lastdailyTimestamp ) )
            )

        DailyTimers.push( newDailyTimerParams )
        return true
    },

    DB_Daily_SetNotified: async function ( guild, userid ){
        await MYSQL_SAVE(`user`, 
            {guildid: guild.id, userid:userid },
            {dailynotified: true })
    },

    isTimeOver: async function( guild, userid, lastdaily ){
        if (module.exports.getDailyTimeLeftMs(lastdaily) > 0 ){
            await module.exports.removeOldTimers()
            await module.exports.dailyCreateTimer(
                guild, userid, lastdaily)

            return false
        }
        return true
    },

    removeOldTimers: async function(){
        if (DailyTimers.length>0){
            for (var i=0; i<DailyTimers.length; i++){
                if(i<0) i=0
                if (DailyTimers[i].length == 0) return
                if (module.exports.getDailyTimeLeftMs(DailyTimers[i].lastdailyTimestamp) < 0 ){
                        clearInterval(DailyTimers[i].timer);
                        DailyTimers.splice(i,1)
                    i--
                }
            }     
        }   
    },

    DailyParameters: function (id, userid, lastdailyTimestamp, timer){
        return {
            guildid: id,
            userid: userid, 
            lastdailyTimestamp: lastdailyTimestamp,
            timer: timer
        }
    },



}