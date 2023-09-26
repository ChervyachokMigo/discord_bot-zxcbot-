
const { SendAnswer, SendError } = require("../tools/embed.js")

module.exports = {
    clearCommand:async function ( args, message, com_text ){
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('MANAGE_MESSAGES')){
            await SendError(message, com_text, `${message.author.username}, у Вас нет прав удалять сообщения.`);
            return
        }

        var count = Number(args[0]);
        var clearcount = 0;
        if (!isNaN(count) && count <= 100){
            try{
                let messages = await message.channel.messages.fetch({ limit: count });
                for (deleteMessage of messages){
                    try{
                        await deleteMessage[1].delete();
                    } catch (e){
                        console.log(e)
                    }
                    clearcount++;
                }
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:  `**${clearcount} из ${count}** сообщений было очищено!`,
                    mentionuser:  `${message.author}`} );
            } catch(e){
                await SendError(message, com_text, `Не удалось удалить сообщения`);
                console.log(e);
            }
        } else {
            await SendError(message, com_text, `Количество должно быть числом не превышающим 100`);
            return
        }
    }
}
