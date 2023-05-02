const { default_prefix } = require (`../settings.js`);
const { getGuildSetting } = require('../modules/guildSettings.js');

function prefix(guildid){
    const guild_prefix = getGuildSetting(guildid, 'prefix');
    if (!guild_prefix) return default_prefix;
    return guild_prefix;
}

module.exports = {
    prefix: prefix,
}