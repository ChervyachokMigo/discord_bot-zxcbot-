const { getOsuUserData } = require("../../stalker/osu");
const { ALL } = require("../constants/enumPermissions");
const { generate_key, check_key } = require("../tools/UserKeysManager");
const { irc_say } = require("../tools/ircManager");

module.exports = {
    command_name: `check_key`,
    command_description: `Проверяет посланный код для привязки`,
    command_aliases: [`key`, `setkey`],
    command_help: `check_key`,
    command_permission: ALL,
    action: async ({channelname, tags, comargs})=>{

        if (channelname !== tags.username) {
            return {error: `[${channelname}] ${tags.username} > Попытка связать канал не владеьцем канала `}
        }

        if (comargs.length == 0){
            return {error: `[${channelname}] ${tags.username} > Не указан ключ для привязки профиля osu `}
        } 

        const key = comargs.shift().trim();

        if (!key) {
            return {error: `[${channelname}] ${tags.username} > Не указан ключ для привязки профиля osu `}
        }

        const result = await check_key ( tags, parseInt(key) );

        if ( result === false ) {
            return {error: `[${channelname}] ${tags.username} > не верный ключ `}
        }

        return {success: `для ${result.twitch.name} привязан аккаунт осу: ${result.osu.name}`};
    }
}