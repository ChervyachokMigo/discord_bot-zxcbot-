const { coins_name, coins_max } = require("../settings.js")
const { checkArgsOfUser, checkArgsOfValue } = require("./tools.js")
const { MYSQL_SAVE } = require("./DB.js")
const { RoleToUser } = require("./roles.js")
const { CheckUser, CheckRole } = require("./DB_tools.js")
const { SendAnswer, SendError } = require("../tools/embed.js")
const { getGuildChannelDB } = require (`./GuildChannel.js`)

module.exports = {

    balanceCommandAction: async function(user, message, com_text){
        if (typeof user === 'undefined'){
            var userdb = await CheckUser( message.channel, message.author.id);
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text: `${message.author.username}, у тебя ${userdb.coins} ${coins_name}`,
                mentionuser: `${message.author}`} );
        } else {
            let userid_balance = await checkArgsOfUser(user, com_text, message)
            if (!userid_balance) return;

            let userdb_balance = await CheckUser( message.channel, userid_balance);
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text: `У ${user} ${userdb_balance.coins} ${coins_name}`,
                mentionuser: `${user}`} );
        }
    },

    rewardCommandAction: async function ( comargs, message, com_text ){
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has("MANAGE_EVENTS")){
            await SendError(message, com_text, `${message.author.username}, у Вас нет прав награждать.`);
            return
        }

        let userid_reward = await checkArgsOfUser(comargs[0], com_text, message)
        if (!userid_reward) return

        let moneyreward = await checkArgsOfValue(comargs[1], com_text, message)
        if (!moneyreward) return
        
        let userdb_reward = await CheckUser( message.channel, userid_reward)            

        
        if (userdb_reward.coins + moneyreward >= coins_max){
            moneyreward = coins_max - userdb_reward.coins
            userdb_reward.coins = coins_max
            
        } else {
            userdb_reward.coins = userdb_reward.coins + moneyreward
        }
        

        if (await MYSQL_SAVE( `user`, {guildid: message.guild.id, userid:userid_reward },
        {coins: userdb_reward.coins })){
            
            if (moneyreward>0){
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text: `${comargs[0]}, тебя наградили на ${moneyreward} ${coins_name}`,
                    mentionuser: `${comargs[0]}` } );
            } else {
                await SendError(message, com_text, `Невозможно.`);
            }
        }
    },

    giveCommandAction: async function ( comargs, message, com_text){
        try{
            var userid_to = await checkArgsOfUser(comargs[0], com_text, message)
            if (!userid_to) return

            var moneygive = await checkArgsOfValue(comargs[1], com_text, message)
            if (!moneygive) return

            var userdb_from = await CheckUser( message.channel, message.author.id)
            var userdb_to = await CheckUser( message.channel, userid_to)
        } catch (e){
            console.log(e)
        }
            
        if (message.author.id == userid_to){
            await SendError(message, com_text, `Ты че шиз?`);
            return
        }
        if (Number(userdb_from.coins) < moneygive){
            await SendError(message, com_text, `Мало`);
            return
        }

        
        userdb_to.coins = userdb_to.coins + moneygive
        userdb_from.coins = userdb_from.coins - moneygive

        await MYSQL_SAVE( `user`,
            {guildid: message.guild.id, userid:message.author.id },
            {coins: userdb_from.coins })
        
        if (await MYSQL_SAVE( `user`, 
        {guildid: message.guild.id, userid:userid_to },
        {coins: userdb_to.coins })){
            let channel = await getGuildChannelDB( message.guild, 'general' )
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:  `${comargs[0]}, тебе дали ${moneygive} ${coins_name}`,
                mentionuser:  `${comargs[0]}` } );
        }
    },

    roleShowSet: async function( comargs, message, com_text){
        var roledb = await CheckRole( comargs[0], com_text, message)

        if (!roledb) return
        
        let Role = await message.guild.roles.cache.find(role => role.id === roledb.roleid);
            
        if (typeof comargs[1] === 'undefined'){
            let rolePriceText = roledb.price
            if (typeof roledb.price === 'undefined'){
                roledb.price = 0
            }
            if (roledb.price == -1){
                rolePriceText = `не продается.`
            }
            if (roledb.price == 0){
                rolePriceText = `бесплатно.`
            }
            if (roledb.price <= 0){
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:  `Роль: ${Role} ${rolePriceText}`,
                    mentionuser:  `${message.author}` } );
            } else {
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:  `Роль: ${Role}, Цена: ${rolePriceText} ${coins_name}`,
                    mentionuser:  `${message.author}` } );
            }
        } else {           
            if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has("MANAGE_ROLES")){
                await SendError(message, com_text, `${message.author.username}, у Вас нет прав устанавливать цену для роли`);
                return
            }

            roledb.price = await checkArgsOfValue(comargs[1], com_text, message, true)
            if (typeof roledb.price === Boolean && roledb.price == false) return

            if (roledb.price >= coins_max){
                roledb.price = coins_max
            }
            if (roledb.price <= -1){
                roledb.price = -1
            }

            if (await MYSQL_SAVE( `role`, 
                {guildid: message.guild.id, roleid:Role.id },
                {price: roledb.price })){
                 
                var newpricetext;
                if (roledb.price>0){
                    newpricetext = `Роли ${Role} установлена новая цена в ${roledb.price} ${coins_name}`;
                } else if (roledb.price == 0){
                    newpricetext = `Роль ${Role} стала бесплатной`;
                } else if (roledb.price == -1){
                    newpricetext = `Роль ${Role} больше не продаётся`;

                }
                await SendAnswer( {channel: message.channel,
                    guildname: message.guild.name,
                    messagetype: `info`,
                    title: com_text.name,
                    text:  newpricetext,
                    mentionuser:  `${message.author}` } );
            }
        }
    },

    roleBuyCommandAction:async function( comargs, message, com_text ){
        var userdb = await CheckUser( message.channel, message.author.id )
        var roledb = await CheckRole( comargs[0], com_text, message )
        if (!roledb) return

        if (roledb.price == -1){
            await SendError(message, com_text, `${comargs[0]} роль не продается`);
            return
        }

        if (userdb.coins<roledb.price){
            await SendError(message, com_text, `Недостаточно ${coins_name}`);
            return
        }

        //role in member
        if(await message.member.roles.cache.find(r => r.id === roledb.roleid)){
            await SendError(message, com_text, `У вас уже есть эта роль.`);
            return
        }

        let buyingRole = await message.guild.roles.cache.find(role => role.id === roledb.roleid)

        userdb.coins = userdb.coins-roledb.price

        if (await MYSQL_SAVE( `user`, 
                {guildid: message.guild.id, userid:message.author.id },
                {coins: userdb.coins })){

            if (await RoleToUser('add', await message.guild.members.fetch(message.author.id), buyingRole.id, com_text.name)){
                    await SendAnswer( {channel: message.channel,
                        guildname: message.guild.name,
                        messagetype: `info`,
                        title: com_text.name,
                        text:  `${message.author} купил роль ${buyingRole} за ${roledb.price} ${coins_name}`,
                        mentionuser:  `${message.author}` } );
                }
                
        }
    },

}