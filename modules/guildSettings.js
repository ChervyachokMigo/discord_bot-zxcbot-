const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_GET_ALL, MYSQL_GET_ALL_RESULTS_TO_ARRAY } = require (`./DB.js`)
const { log } = require("../tools/log.js")

var guildSettingsCache = [];

async function initGuildSettings(guildid){
    log('Загрузка настроек гильдии '+guildid);
    try{
        let mysql_guildSettings = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(`guildSettings`, { guildid: guildid } ))
        guildSettingsCache = guildSettingsCache.concat(mysql_guildSettings);
    } catch (e){
        console.log(e)
    }
}

async function changeGuildSetting(guildid, settingname, value){
    console.log(`guildid`, guildid)
    var newsetting = {guildid, settingname, value};
    let i = guildSettingsCache.findIndex(val => val.guildid === guildid && val.settingname === settingname);
    if (i == -1){
        guildSettingsCache.push(newsetting);
    } else {
        guildSettingsCache[i].value = value;
    }
    try{
        await MYSQL_SAVE(`guildSettings`, { guildid: guildid, settingname: settingname}, {value: value});
    } catch (e){
        console.log(e)
        return false;
    }
}

function getGuildSetting(guildid, settingname){
    let setting_i = guildSettingsCache.findIndex(val=>val.guildid === guildid && val.settingname === settingname);
    if (setting_i == -1) return false;
    
    return guildSettingsCache[setting_i].value;
}

module.exports = {
    initGuildSettings: initGuildSettings,
    changeGuildSetting: changeGuildSetting,
    getGuildSetting: getGuildSetting
}