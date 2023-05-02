const axios = require('axios');

const { getDiscordRelativeTime } = require('../tools/time.js');
const { SendAnswer } = require("../tools/embed.js")
const { setInfinityTimerLoop, getBooleanFromString } = require("../modules/tools.js");
const { getGuildChannelDB } = require("../modules/GuildChannel.js")
const { getGuildSetting } = require('../modules/guildSettings.js');

async function crypto_check_start(guild){
    await crypto_check(guild);
    setInfinityTimerLoop(async ()=>{await crypto_check(guild);}, 7200);
}

async function crypto_check(guild){
    if (!(getBooleanFromString(getGuildSetting(guild.id, 'crypto')))) return false;
    var cryptoinfo = await getPrices()+`\nДата: ${getDiscordRelativeTime(new Date().valueOf())}`
    var CryptoChannel = await getGuildChannelDB( guild ,`crypto`);

    await SendAnswer( {channel: CryptoChannel,
        guildname: guild.name,
        messagetype: `info`,
        title: `Crypto info`,
        text:  cryptoinfo } );
}

async function getPrices(){
    var BTCUSDT = await getPriceCoinPair('BTCUSDT')
    var BTCRUB = await getPriceCoinPair('BTCRUB')
    var ETHUSDT =  await getPriceCoinPair('ETHUSDT')
    var XRPUSDT =  await getPriceCoinPair('XRPUSDT')


    var coins = {
        BTC: {RUB: BTCRUB, USDT: BTCUSDT}, 
        ETH: {USDT: ETHUSDT},
        RUB: {USDT: (BTCRUB/BTCUSDT).toFixed(6)},
        USDT: {RUB: (BTCUSDT/BTCRUB).toFixed(6)},
        XRP: {USDT: XRPUSDT, RUB: (XRPUSDT/(BTCUSDT/BTCRUB).toFixed(6)).toFixed(6)}
    };

    var coins_text = `BTC/RUB: \`${coins.BTC.RUB}\`\n`+
    `BTC/USDT: \`${coins.BTC.USDT}\`\n`+
    `ETH/USDT: \`${coins.ETH.USDT}\`\n`+
    `RUB/USDT: \`${coins.RUB.USDT}\`\n`+
    `USDT/RUB: \`${coins.USDT.RUB}\`\n`+
    `XRP/USDT: \`${coins.XRP.USDT}\`\n`+
    `XRP/RUB: \`${coins.XRP.RUB}\`\n`;



    return coins_text;
}

async function getPriceCoinPair(symbol){
    let url = `https://api.binance.com/api/v3/avgPrice?symbol=${symbol}`;
    return new Promise(async (res,rej) =>{
        await axios.get(url).then( result =>{
            res(Number(result.data.price).toFixed(6));
        });
    });
}

module.exports = {
    crypto_check_start: crypto_check_start,
    getPrices: getPrices,
};