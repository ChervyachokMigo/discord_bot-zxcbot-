const { ModerationName } = require("../constants/general");

module.exports = {
    command_name: `contacts`,
    command_description: `Показывает ссылку на сайт`,
    command_aliases: [`contacts`, `personal`, `site`, `контакты`, `сайт`],
    command_help: `contacts`,
    action: async ({channelname, tags, comargs})=>{
        if (channelname === ModerationName){
            return  {success: `Мой сайт: https://svdgod.ru`};
        }
    }
}