const { getGuildChannelDB } = require (`../../modules/GuildChannel.js`);
const { getDiscordRelativeTime } = require('../../tools/time.js');
const { SendAnswer } = require("../../tools/embed.js");
const { messageDeleteAfter} = require("../tools.js");

const domainname = 'svdgod.ru';

const { mailerEvents } = require("./mailer-main.js");

module.exports = {
    init: function (guild) {
        mailerEvents.on('new_message', async (data)=>{

            const channel = await getGuildChannelDB(guild, 'mailer');

            const to = `Кому: **${data.sendTo}@${domainname}**`;
            const subject = `Тема: **${data.subject}**`;
            const date = `Получено ${getDiscordRelativeTime(data.date.value)}`;
            const link = `https://mail.${domainname}/${data.link}`;

            await SendAnswer({ channel,
                guildname: guild.name,
                messagetype: `info`,
                title: `Новое сообщение от ${data.sender}`,
                text: `${to}\n${subject}\n${date}`,
                url: link
            });
            
        });

        mailerEvents.on('auth_key', async (data)=>{

            const channel = await getGuildChannelDB(guild, 'mailer');
            const key_timeout = new Date().getTime() + data.key_timeout;
            const msg = await SendAnswer({ channel,
                guildname: guild.name,
                messagetype: `info`,
                title: `Авторизация от ${data.ip}`,
                text: `Ключ: ${data.key}\nИсчезнет ${getDiscordRelativeTime(key_timeout)}`
            });

            messageDeleteAfter(msg, Math.trunc(data.key_timeout / 1000));
            
        });

        mailerEvents.on('auth_control_key', async (data)=>{

            const channel = await getGuildChannelDB(guild, 'control');
            const key_timeout = new Date().getTime() + data.key_timeout;
            const msg = await SendAnswer({ channel,
                guildname: guild.name,
                messagetype: `info`,
                title: `Авторизация от ${data.ip}`,
                text: `Ключ: ${data.key}\nИсчезнет ${getDiscordRelativeTime(key_timeout)}`
            });

            messageDeleteAfter(msg, Math.trunc(data.key_timeout / 1000));
            
        });
    },

    emit: ( name, args ) => {
        mailerEvents.emit( name, args );
    }
}