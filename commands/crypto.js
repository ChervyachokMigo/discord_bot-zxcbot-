const { modules } = require (`../settings.js`);

const { SendAnswer, SendError } = require("../tools/embed.js");

const { check_exist_coinpair, MYSQL_CRYPTO_TRACKING_CHANGE, get_guild_coinpairs } = require (`../modules/crypto.js`);

module.exports = {
    command_name: `Crypto`,
    command_description: `Управление крипто инфой.`,
    command_aliases: [`crypto`],
    command_help: `crypto tracking[_info] [coin-pair]`,
    action: async (comargs, message)=>{
        if (modules.crypto){
            if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has('ADMINISTRATOR')){
                await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${message.author.username}, у Вас нет прав для этого действия.`);
                return
            }
            var comaction = comargs.shift();
            switch (comaction){
                case 'tracking_info':
                    await get_guild_tracking_coinpairs(message);
                break;

                case 'tracking': 
                    if (comargs.length == 0){
                        await get_guild_tracking_coinpairs(message);
                        break;
                    };
                    
                    await set_tracking(message, comargs, true);
                    break;

                case 'untracking':
                    await set_tracking(message, comargs, false);
                    break;

                default:
                    await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неправильное действие`);   
                    return
            }
        }
    }
}

async function set_tracking(message, comargs, is_tracking){
    const [first, second] = comargs.pop().split('-');
    if (!first || !second){
        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Неверная криптопара. Напишите пару через дефис, например BTC-USDT`);
        return false
    }
    const pair = {first, second};
    if( ! (await check_exist_coinpair( pair )) ){
        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `Не существует такая криптопара: `+ first + '-' + second);
        return false
    }
    
    var result = await MYSQL_CRYPTO_TRACKING_CHANGE(message.guild.id, pair , is_tracking);

    if (result.success){
        await SendAnswer( {channel:  message.channel,
            guildname: message.guild.name,
            messagetype: `info`,
            title: `${module.exports.command_name}`,
            text: `${result.text}`} );
        return true;
    } else {
        await SendError(message, {name: module.exports.command_name, help: module.exports.command_help }, `${result.text}`);
        return false;
    }
}

async function get_guild_tracking_coinpairs(message){
    const guild_pairs = await get_guild_coinpairs(message.guild.id);

    var result = {
        text: `tracking coinpairs:\n` + guild_pairs.map( p => `**${p.first}-${p.second}**`).join(`\n`)
    }

    await SendAnswer( {channel:  message.channel,
        guildname: message.guild.name,
        messagetype: `info`,
        title: `${module.exports.command_name}`,
        text: `${result.text}`} );
}