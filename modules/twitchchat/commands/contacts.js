const { CHANNEL } = require("../constants/enumPermissions");

module.exports = {
    command_name: `contacts`,
    command_description: `Показывает ссылку на сайт`,
    command_aliases: [`contacts`, `personal`, `site`, `контакты`, `сайт`],
    command_help: `contacts`,
    command_permission: CHANNEL,
    action: async ({channelname, tags, comargs})=>{
        return  {success: `Мой сайт: https://svdgod.ru`};
    }
}