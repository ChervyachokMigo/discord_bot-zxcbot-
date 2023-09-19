const { getGuildChannelDB } = require (`../../modules/GuildChannel.js`);
const { getDiscordRelativeTime } = require('../../tools/time.js');
const { SendAnswer } = require("../../tools/embed.js");

const domainname = 'svdgod.ru';

module.exports = {
    init: function (mailerEvents, guild) {
        mailerEvents.on('new_message', async (data)=>{

            const channel = await getGuildChannelDB(guild, 'mailer');

            await SendAnswer({ channel,
                guildname: guild.name,
                messagetype: `info`,
                title: `Новое сообщение от ${data.sender}`,
                text: `Кому: **${data.sendTo}@${domainname}**\nТема: **${data.subject}**\nПолучено в: ${getDiscordRelativeTime(data.date.value)}\nСообщение в файле: ${data.filepath}`
            });
            
        });
    }
}