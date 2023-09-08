const { MYSQL_SAVE,   MYSQL_GET_TRACKING_DATA_BY_ACTION} = require (`./DB.js`)
const { log } = require("../tools/log.js")

var guildSettingsCache = [];

async function initGuildSettings(guildid){
    log('Загрузка настроек гильдии ' + guildid);
    let mysql_guildSettings =  await MYSQL_GET_TRACKING_DATA_BY_ACTION('guildSettings', { guildid });    
    guildSettingsCache = guildSettingsCache.concat(mysql_guildSettings);
    return true;
}

async function changeGuildSetting(guildid, settingname, value){
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