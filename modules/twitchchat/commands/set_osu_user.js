const { getOsuUserData } = require("../../stalker/osu");
const { ALL } = require("../constants/enumPermissions");
const { generate_key } = require("../tools/UserKeysManager");
const { irc_say } = require("../tools/ircManager");

module.exports = {
    command_name: `set_osu_user`,
    command_description: `Отправляет код юзеру для привязки`,
    command_aliases: [`setuser`, `userset`, `register`, `getkey`],
    command_help: `set_osu_user`,
    command_permission: ALL,
    action: async ({channelname, tags, comargs})=>{

        if (channelname !== tags.username) {
            return {error: `[${channelname}] ${tags.username} > Попытка связать канал не владеьцем канала `}
        }

        if (comargs.length == 0){
            return {error: `[${channelname}] ${tags.username} > Не указано имя профиля osu `}
        } 

        const osu_username = comargs.join(' ').trim();
        const userinfo = await getOsuUserData(osu_username);

        if (typeof userinfo.username === 'undefined' || userinfo.error){
            return {error: `Osu user **${osu_username}** not exists`}
        }

        const keypair = generate_key(tags, userinfo);

        irc_say(osu_username, `This bot sended the auth request from https://www.twitch.tv/${tags.username}: Enter command "!key ${keypair.key}" to bind osu profile`);
    
        return  {error: `set_user`};
    }
}