const axios = require('axios');

const { getDiscordRelativeTime } = require('../tools/time.js');
const { SendAnswer } = require("../tools/embed.js")
const { setInfinityTimerLoop, getBooleanFromString } = require("../modules/tools.js");
const { getGuildChannelDB } = require("../modules/GuildChannel.js")
const { getGuildSetting } = require('../modules/guildSettings.js');

async function crypto_check_start(guild){
    await crypto_check(guild);
    setInfinityTimerLoop(async ()=>{await crypto_check(guild);}, 14400);
}

async function crypto_check(guild){
    if (!(getBooleanFromString(getGuildSetting(guild.id, 'crypto')))) return false;
    var cryptoinfo = await getPrices()+`Дата: ${getDiscordRelativeTime(new Date().valueOf())}`
    var CryptoChannel = await getGuildChannelDB( guild ,`crypto`);

    await SendAnswer( {channel: CryptoChannel,
        guildname: guild.name,
        messagetype: `info`,
        title: `Crypto info`,
        text:  cryptoinfo } );
}

async function getPrices(){
    const pairs_to_request = [
        {first: 'BTC', second: 'USDT'},
        {first: 'BTC', second: 'RUB'},
        {first: 'ETH', second: 'USDT'},
        {first: 'XRP', second: 'USDT'},
    ];

    var coinpair = [];

    for (let pair of pairs_to_request ){
        let value = await getPriceCoinPair(pair.first + pair.second);
        coinpair.push( formatNewPair( pair.first, pair.second, value ) );
    }

    async function set_all_pairs(){
        var newPairsCount = 0;
        for (let i in coinpair){
            for (let j in coinpair){
                
                if (i === j) continue;

                var pair1 = coinpair[i];
                var pair2 = coinpair[j];

                if (coinpair.findIndex( p => p.first.includes(pair1.second) && p.second.includes(pair2.second) ) > -1 ) continue;
                if (coinpair.findIndex( p => p.first.includes(pair1.first) && p.second.includes(pair2.first) ) > -1 ) continue;

                if (pair1.first.includes(pair2.first)) {
                    newPairsCount++;
                    coinpair.push( formatNewPair(pair1.second, pair2.second, pair2.value / pair1.value));
                }
                
                if (pair1.second.includes(pair2.second)) {
                    newPairsCount++;
                    coinpair.push( formatNewPair(pair1.first, pair2.first, pair1.value / pair2.value));
                }
                
            }
        }
        return newPairsCount;
    }

    function formatNewPair(first, second, value){
        return {
            first: first,
            second: second,
            value: value,
            toString: function(){
                var display_value;
                if (this.value >= 1){
                    display_value = this.value.toFixed(3);
                } else if (this.value < 1 && this.value >= 0.01 ) {
                    display_value = this.value.toFixed(5);
                } else if (this.value < 0.01 && this.value >= 0.0001 ) {
                    display_value = this.value.toFixed(7);
                } else {
                    display_value = this.value.toFixed(9);
                }
                return `${this.first}/${this.second}: \`${display_value}\``;
            }
        }
    }

    while (await set_all_pairs() > 0){ }

    return coinpair.join('\n') + '\n';
}

async function getPriceCoinPair(symbol){
    let url = `https://api.binance.com/api/v3/avgPrice?symbol=${symbol}`;
    return new Promise(async (res,rej) =>{
        await axios.get(url).then( result =>{
            res(Number(result.data.price));
        });
    });
}

module.exports = {
    crypto_check_start: crypto_check_start,
    getPrices: getPrices,
};