const os = require("os");
const { SendAnswer } = require("../tools/embed.js");
const { getObjectKeyByValue } = require('../modules/tools.js');
const { getDiscordRelativeTime } = require('../tools/time.js');
//const  discord = require('discord.js')
module.exports = {
    
    command_name: `Server Info`, 
    command_description: `Показывает информацию о боте.`,
    command_aliases: [`serverinfo`],
    command_help: `serverinfo`,
    action: async (comargs, message)=>{
        const freeMemory = (os.freemem()/1048576).toFixed(2);
        const totalMemory = (os.totalmem()/1048576).toFixed(2);
        const freememoryProcents = Math.trunc(Number(freeMemory)/Number(totalMemory)*100);

        const memoryUsage = (process.memoryUsage().rss/1048576).toFixed(2);
        const processUsageProcents = Math.trunc(Number(memoryUsage)/Number(freeMemory)*100);
        
        const processPriority = getObjectKeyByValue(os.getPriority(), os.constants.priority)
        const processUptime = getDiscordRelativeTime(new Date().valueOf() - process.uptime()*1000 );

        const guild = message.guild;

        var text = '';
        text += `**Сервер**: \`${guild.name}\`\n`;
        text += `ХОЗЯИН сервера: <@!${guild.ownerId}>\n`;
        text += `Создано ролей: \`${guild.roles.cache.size}\`\n`;
        text += `Добавлено эмодзи: \`${guild.emojis.cache.size}\`\n`;
        text += `Добавлено стикеров: \`${guild.stickers.cache.size}\`\n`;
        text += `Создано каналов: \`${guild.channels.cache.size}\`\n`;
        text += `Забанено: \`${guild.bans.cache.size}\`\n`;
        text += `Всего юзеров: \`${guild.memberCount}\`\n`;
        text += `Создан: ${getDiscordRelativeTime(guild.joinedTimestamp)}\n`;
        
        text += `\n`;
        text += `**Информация о боте**\n`;
        text += `Осталось памяти: \`${freeMemory}/${totalMemory} MBs (${freememoryProcents}%)\`\n`;
        text += `Использовано процессом: \`${memoryUsage} MBs (${processUsageProcents}%)\`\n`;
        text += `Приоритет процесса: \`${processPriority}\`\n`;
        text += `Сервер запущен: ${processUptime}\n`;
        text += `\n`;
        text += `Создатель бота: <@!675367461901828126>\n\`По вопросам и предложениям обращайтесь сюда\`\n`;

        await SendAnswer( {channel:  message.channel,
            guildname: message.guild.name,
            messagetype: `info`,
            title: `${module.exports.command_name}`,
            text: `${text}`} );
    }
}