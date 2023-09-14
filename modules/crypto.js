const axios = require('axios');

const { getDiscordRelativeTime } = require('../tools/time.js');
const { SendAnswer } = require("../tools/embed.js")
const { setInfinityTimerLoop, getBooleanFromString } = require("../modules/tools.js");
const { getGuildChannelDB } = require("../modules/GuildChannel.js")
const { getGuildSetting } = require('../modules/guildSettings.js');

const { MYSQL_SAVE,  MYSQL_GET_ONE, manageGuildCryptoTracking,  getGuildidsOfTrackingUserServiceByGuildId} = require("./DB.js");

async function crypto_check_start(guild){
    await crypto_check(guild);
    setInfinityTimerLoop(async ()=>{await crypto_check(guild);}, 14400);
}

async function crypto_check(guild){
    if (!(getBooleanFromString(getGuildSetting(guild.id, 'crypto')))) return false;
    var cryptoinfo = await getPrices(guild)+`Дата: ${getDiscordRelativeTime(new Date().valueOf())}`
    var channel = await getGuildChannelDB( guild ,`crypto`);

    await SendAnswer( {channel: channel,
        guildname: guild.name,
        messagetype: `info`,
        title: `Crypto info`,
        text:  cryptoinfo } );
}

//изначально все пары is_online = true, генерируются все варианты и убираются лишние, оставшиеся запрашиваются в апи, у них остается Is_online=true
//затем эти пары снова расширяются и у новых пар считается значение и ставится is_online=false
async function getPrices(guild){

    //получить пары коинов гильдии
    const guild_pairs = await get_guild_coinpairs (guild.id);
        
    //вычислить уникальные пары и получить онлайн значения
    const pairs_to_request = get_unique_pairs( await get_all_pairs(guild_pairs) );

    const calculated_pairs = await Promise.all( pairs_to_request.map ( async pair => await get_pair_with_value_change( pair ) ));
    
    const calculated_all_pairs = await get_all_pairs(calculated_pairs);

    await save_coinpairs (calculated_all_pairs);

    const calculated_requested_pairs = calculated_all_pairs.filter( p =>
        guild_pairs.findIndex( pair => pair.first.includes(p.first) &&  pair.second.includes(p.second) ) > -1 );

    return calculated_requested_pairs.map( p => coinpair_display(p)).join('\n') + '\n';
}

async function check_exist_coinpair(pair){
    const res = await getPriceCoinPair( pair );
    if (res.error) {
        console.error('Пара не существует', pair);
        return false;
    }
    return true;
}

async function get_guild_coinpairs(guild_id){
    const coins_in_mysql = await getGuildidsOfTrackingUserServiceByGuildId('cryptocoins_tracking', guild_id);
    return coins_in_mysql.map( p => {
        const [first, second]= p.split('-');
        return {first, second, is_online: true};
    });
}

async function get_pair_with_value_change(pair){

    async function get_value_change( pair ){
        let old_pair = await MYSQL_GET_ONE('cryptopairs', {first: pair.first, second: pair.second});
        return old_pair === null? 0: (pair.value - old_pair.dataValues.value);
    }

    pair.value = pair.is_online == true? await getPriceCoinPair( pair ): pair.value;
    pair.value_change = await get_value_change( pair );

    return pair;
};

async function get_all_pairs( original_pairs ){
    var all_pairs = original_pairs.map( p=> p);
    var newPairsCount = -1;
    while (newPairsCount > 0 || newPairsCount == -1){
        newPairsCount = 0;
        for (let i in all_pairs){
            for (let j in all_pairs){
                
                if (i === j) continue;

                var pair1 = all_pairs[i];
                var pair2 = all_pairs[j];

                if (all_pairs.findIndex( p => p.first.includes(pair1.second) && p.second.includes(pair2.second) ) > -1 ) continue;
                if (all_pairs.findIndex( p => p.first.includes(pair1.first) && p.second.includes(pair2.first) ) > -1 ) continue;

                if (pair1.first.includes(pair2.first)) {
                    newPairsCount++;
                    if (pair1.value && pair2.value){
                        const pair = {first: pair1.second, second: pair2.second, value: pair2.value / pair1.value, is_online: false };
                        var new_pair = await get_pair_with_value_change( pair );
                    } else {
                        var new_pair = {first: pair1.second, second: pair2.second, is_online: true};
                    }
                    all_pairs.push( new_pair );
                }
                
                if (pair1.second.includes(pair2.second)) {
                    newPairsCount++;
                    if (pair1.value && pair2.value){
                        const pair = {first: pair1.first, second: pair2.first, value: pair1.value / pair2.value, is_online: false };
                        var new_pair = await get_pair_with_value_change( pair );
                    } else {
                        var new_pair =  {first: pair1.first, second: pair2.first, is_online: true};
                    }
                    all_pairs.push( new_pair );
                }
            }
        }
    }
    return all_pairs;
}

function get_unique_pairs(pairs){
    const uniqueChain = [];
    const usedCoins = new Set();

    for (const pair of pairs) {
        if (!usedCoins.has(pair.first) || !usedCoins.has(pair.second)) {
            uniqueChain.push(pair);
            usedCoins.add(pair.first);
            usedCoins.add(pair.second);
        }
    }

    return uniqueChain;
}

function coinpair_display(pair){
    var display_value;
    const value_abs = Math.abs(pair.value);
    if (value_abs >= 1){
        display_value = pair.value.toFixed(3);
    } else if (value_abs < 1 && value_abs >= 0.01 ) {
        display_value = pair.value.toFixed(5);
    } else if (value_abs < 0.01 && value_abs >= 0.0001 ) {
        display_value = pair.value.toFixed(7);
    } else {
        display_value = pair.value.toFixed(9);
    }
    var display_value_change;
    const value_change_abs =  Math.abs(pair.value_change);
    if (value_change_abs >= 1){
        display_value_change = pair.value_change.toFixed(3);
    } else if (value_change_abs < 1 && value_change_abs >= 0.01 ) {
        display_value_change = pair.value_change.toFixed(5);
    } else if (value_change_abs < 0.01 && value_change_abs >= 0.0001 ) {
        display_value_change = pair.value_change.toFixed(7);
    } else {
        display_value_change = pair.value_change.toFixed(9);
    }
    display_value_change = pair.value_change > 0? '+' + display_value_change: display_value_change;

    return `${pair.first}/${pair.second}: \`${display_value} (${display_value_change})\``;
}

async function save_coinpairs (coinpairs){
    for (const coinpair of coinpairs){
        const pair_key = {first: coinpair.first, second: coinpair.second};

        await MYSQL_SAVE('cryptopairs', pair_key, {
            value: coinpair.value,
            value_change: coinpair.value_change,
            is_online: coinpair.is_online,
            last_update: new Date()
        });
    }    
}

async function getPriceCoinPair( pair ){
    let symbol = pair.first + pair.second;
    let url = `https://api.binance.com/api/v3/avgPrice?symbol=${symbol}`;
    return new Promise(async (res, rej) =>{
        await axios.get(url).then( result =>{
            res(Number(result.data.price));
        }).catch ( (err) => {
            res({error: err.code})
        });
    });
}

module.exports = {
    crypto_check_start: crypto_check_start,
    check_exist_coinpair: check_exist_coinpair,
    get_guild_coinpairs: get_guild_coinpairs,
    MYSQL_CRYPTO_TRACKING_CHANGE: async function (guild_id, pair, is_tracking){
        if (is_tracking == true){
            const guild_pairs = await get_guild_coinpairs(guild_id);
            if (guild_pairs.findIndex( p => p.first.includes(pair.first) && p.second.includes(pair.second)) > -1){
                return {success: false, text: `Cryptopair **${pair.first}-${pair.second}** already exists`};
            }
        }
        await manageGuildCryptoTracking(guild_id, 'cryptocoins', 'tracking', pair, is_tracking);
        return {success: true, text: `Cryptopair **${pair.first}-${pair.second}** changed tracking: ${is_tracking}`};
    }
};