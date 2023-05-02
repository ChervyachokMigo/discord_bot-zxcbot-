
module.exports = {
    command_name: `Restart`,
    command_description: `Перезагрузка бота`,
    command_aliases: [`restart`, `reboot`],
    command_help: `restart`,
    action: async (comargs, message)=>{
        if (message.author.id !== '675367461901828126'){  //testerpivka17
            await SendError(message, stalkerSettings, `${message.author.username}, у Вас нет прав для этого действия.`);
            return false
        }
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
            await SendError(message, stalkerSettings, `${message.author.username}, у Вас нет прав для этого действия.`);
            return false
        }
        await message.reply(`**${message.author.username}**, сервер будет перезагружен.`);
        return 'restart';
    }
}