const { LogString } = require("../tools/log.js")

const { checkBlock } = require (`../modules/DB_tools.js`);
const { getGuildChannelDB, setGuildChannelDB } = require (`../modules/GuildChannel.js`);
const  { restrictCheck } = require (`../modules/restrictCheck.js`);
const {modules} = require('../settings.js');

const { messageReplayCheck } = require(`../modules/osu_replay.js`) 

const { getAvailableCommands } = require(`../modules/commands.js`);

const { prefix } = require('../modules/prefixSetting.js');

module.exports = async (message) => {
    if (message.author.bot) return
    
    if (modules.restrict) {
        await restrictCheck(message);
    }
    
    if (modules.osu_replay){
        await messageReplayCheck(message);
    }

    if (!message.content.startsWith(prefix(message.guild.id))) return

    var isUserModeratable = message.guild.members.cache.find(m=>m.id == message.author.id).moderatable;

    if (isUserModeratable && await checkBlock(message)){
        await message.reply(`Вы не можете писать команды боту.`)
        LogString(message.guild.name, `Error`, `Block User State`, `Заблокированый юзер ${message.author.username} попытался написать боту команду.`)
        return
    }

    const commandBody = message.content.trim().slice(prefix(message.guild.id).length);
    var comargs = commandBody.replace(/ +/g, ' ').trim().split(' ');
    const command = comargs.shift().toLowerCase();

    var botChannel = await getGuildChannelDB( message.guild ,`system` );

    if (!botChannel) {
        if (command === 'channel') {
            await require(`../commands/channel.js`).action(comargs, message);
        } else {
            await setGuildChannelDB(message.guild, 'system', message.channel.id);
        }
    }    

    
    for (let AvailableCommand of getAvailableCommands()){
        if (AvailableCommand.alias.includes(command)){
            var res = await require(`../commands/${AvailableCommand.filename}`).action(comargs, message);
            if (res && res === 'restart'){
                throw new Error('restart');
            }
            break;
        }
    }
}