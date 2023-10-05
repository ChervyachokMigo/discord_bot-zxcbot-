
module.exports = {
    command_name: `contacts`,
    command_description: `Показывает ссылку на сайт`,
    command_aliases: [`contacts`, `personal`, `site`, `контакты`, `сайт`],
    command_help: `contacts`,
    action: async ({channelname, tags, comargs, twitchchat})=>{
        if (channelname === 'sed_god'){
            await twitchchat.say( channelname, `Мой сайт: https://svdgod.ru` );
        }
    }
}