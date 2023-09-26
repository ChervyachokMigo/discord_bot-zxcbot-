const { restrict_words } = require('../settings.js');
const { Permissions } = require("discord.js");
const { SendAnswer } = require("../tools/embed.js")

const mutetime = 30;
const notify_mute = true;

var MutedList = [];

module.exports = {
    restrictCheck : async function ( message ){
        if (message.content.length < 3) {
            return;
        }

        var member = await message.guild.members.cache.find(u=>u.id === message.author.id);
        var user = message.author;

        if (await checkPermissions (member)) {
            //console.log(`мембер не проверяется.`)
            return
        }

        message.content = message.content.toLowerCase();
        var reason = ``;
        
        for (var word of restrict_words){
            if (word.type === `links`){
                reason = `запрещенные ссылки`
            }
            if (word.type === `words`){
                reason = `запрещенные слова`
            }
            for (var wordvalue of word.values){
                if (message.content.indexOf(wordvalue)> -1){

                    if (!wordvalue) continue;

                    await member.timeout(mutetime * 1000, reason);
                    
                    try{
                        await message.delete();
                    } catch (e){
                        console.log(e)
                    }
                    
                    MutedList.push({user: user, reason: reason,  messagetime: message.createdAt });
                    
                    setTimeout(() => {
                        MutedList.splice(MutedList.findIndex(val=>val.user === user))
                    }, mutetime*1000);

                    console.log(`${user} отправлен в мут на ${mutetime} сек по причине: ${reason}`);

                    if(notify_mute){
                        await SendAnswer( {channel: message.channel,
                            guildname: message.guild.name,
                            messagetype: `info`,
                            title: 'Restrict',
                            text:   `${user} отправлен в мут на ${mutetime} сек по причине: ${reason}`} );
                    }
                    break;
                }
            }
        }
    },

    printMutedList: async (message)=>{
        var msgtext = ``;
        if (MutedList.length > 0){
            for (var user of MutedList){
                msgtext += `${user.user} ${user.reason} ${mutetime} сек\n`;
            }
        } else {
            msgtext = `Никто не замючен`;
        }
        message.reply(msgtext)
    },

}

async function checkPermissions(member){
    return member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
    member.permissions.has(Permissions.FLAGS.BAN_MEMBERS) ||
    member.permissions.has(Permissions.FLAGS.KICK_MEMBERS) ||
    member.permissions.has(Permissions.FLAGS.MUTE_MEMBERS) ||
    member.permissions.has(Permissions.FLAGS.MODERATE_MEMBERS);
}