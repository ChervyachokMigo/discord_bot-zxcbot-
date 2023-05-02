const { SendAnswer, SendError } = require("../tools/embed.js");

module.exports = {
    command_name: `Osu beatmap background`,
    command_description: `Показывает полный фон карты.`,
    command_aliases: [`osubg`, `bg`, `osubackground`],
    command_help: `osubg id`,
    action: async (comargs, message)=>{
        var beatmapsetid = Number(comargs.shift());
        if (isNaN(beatmapsetid)){
            await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `неверно введен Id`);  
            return    
        }

        await SendAnswer( {channel:  message.channel,
                            guildname: message.guild.name,
                            messagetype: `info`,
                            title: `${module.exports.command_name}`,
                            text: `${beatmapsetid}`, 
                            image: `https://assets.ppy.sh/beatmaps/${beatmapsetid}/covers/raw.jpg`},
                        );
    }
}