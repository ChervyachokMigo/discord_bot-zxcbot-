
const { v2, tools } = require ('osu-api-extended');

const { log } = require("../tools/log.js");

const { NOTETYPE, NOTECOLOR } = require('./osu_replay/osu_note_types.js');
const KEYTYPE = require('../constantes/const_osu_keys_type.js');
const HITTYPE = require('../constantes/const_osu_hits_type.js');
const GAMEMODE = require('../constantes/const_osu_gamemodes.js')

const { calculateMods } = require('../constantes/const_osu_mods.js');

const { checkTokenExpires } = require (`./stalker/requests.js`);

const { OsuHunter_updateTime } = require('../settings.js');
const { getYMD, formatSecondsToTime } = require('../tools/time.js');

const { MYSQL_SAVE, MYSQL_GET_ONE } = require('../modules/DB.js');

async function hunter(user, mode = 'taiko'){
    if (!await checkTokenExpires('osu')){
        return {error: `Невозможно соединиться с пеппи... Муси муси?`};;
    };

    var user_country = user.country_code;
    var userid = user.id;
    var country_rank = user.statistics.country_rank;

    //var global_rank = user.statistics.global_rank;
    //var playmode = user.playmode;

    var page = country_rank/50+1;
    if (page>200){
        return {error: 'Юзер вне списков производительности.'}
    }
   
    var res = (await v2.ranking.details(mode, "performance", {country: user_country , page: page })).ranking;
    var user_position_in_list = res.findIndex(val=>val.user.id === userid);
    console.log(user_position_in_list, res[user_position_in_list]);
    console.log(res);

    await MYSQL_SAVE('osuHunterTrackingUser', {userid: userid}, {lastUpdated: getYMD()});
}

async function hunter_init(playername){
    
    if (!await checkTokenExpires('osu')){
        return {error: `Невозможно соединиться с пеппи... Муси муси?`};;
    };
    var user = await v2.user.details(playername, 'taiko');

    var hunterTime = new Date(`${getYMD()} ${OsuHunter_updateTime}`) - new Date();
    if (hunterTime<0){ ///asdasd
        log('ожидание таймера '+formatSecondsToTime(hunterTime/1000), 'osu hunter' );
        setTimeout(async ()=>{
            await hunter(user);
        }, hunterTime);
    } else {
        var osuhunter_trackinguser = await MYSQL_GET_ONE('osuHunterTrackingUser', {userid: user.id});
        console.log()
        if (osuhunter_trackinguser === null){
            await hunter(user);
        } else {//
            var osuHunterNeedUpdate = new Date(`${osuhunter_trackinguser.dataValues.lastUpdated} ${OsuHunter_updateTime}`) <
            new Date(`${getYMD()} ${OsuHunter_updateTime}`);
            
            if (osuHunterNeedUpdate){
                await hunter(user);
            }

        }
        
    }
    
}
/*
(async ()=>{
    await hunter_init('sadgod');
})();*/


