const axios = require('axios');
const SteamAPI = require('steamapi');
const { auth } = require ('osu-api-extended');
const express = require('express');
const bodyParser = require('body-parser');
const { log, LogString } = require("../../tools/log.js");
const { MYSQL_SAVE, MYSQL_GET_ONE } = require("../DB.js");

const {
    TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET,
    TROVO_CLIENT_ID, 
    STREAM_API_KEY,
    VK_TOKEN,
    OSU_LOGIN,
    OSU_PASSWORD
} = require('../../config.js');

const { stalkerTrovoClipsPeriod } = require('../../settings.js');
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require('../tools.js');

var tokens = {
    twitch: {},
    steam: {},
    osu: {}
}

var steam;

async function checkTokenExpires(platform){
    var endtime = 0;
    switch(platform){
        case 'twitch':
            log('twitch token checking', 'twitch token')
            if (typeof tokens.twitch.value === 'undefined'){
                var tokendata = await MYSQL_GET_ONE('token', {platform: platform});
                if (tokendata === null){
                    if(!(await initTwitch())){
                        return false;
                    }
                } else {
                    tokens.twitch = tokendata.dataValues;
                }
            }
            endtime = tokens.twitch.getdate + tokens.twitch.expires;
            if (endtime < (new Date().valueOf()-60)/1000){
                if(!(await initTwitch())){
                    return false;
                }
            }
        break;
        case 'steam': 
            log('steam token checking', 'steam token')
            if (typeof steam === 'undefined'){
                await initSteam();
            }
            endtime = tokens.steam.getdate + tokens.steam.expires;
            if (endtime < (new Date().valueOf()-60)/1000){
                await initSteam();
            }
        break;
        case 'osu': 
            log('osu token checking', 'osu token')
            if (typeof tokens.osu.value === 'undefined'){
                if (await initOsu() == false){
                    return false
                }
            }
            endtime = tokens.osu.getdate + tokens.osu.expires;
            if (endtime < (new Date().valueOf()-60)/1000){
                if (await initOsu() == false){
                    return false
                }
                return true
            } else {
                return true
            }
        break;
        default:
            throw new Error('token: undefined platform')
    }
}

async function initOsu(){     
    var mysql_token = await MYSQL_GET_ONE('token', {platform: 'osu'});
    if (mysql_token !== null){

        mysql_token = mysql_token.dataValues;

        var nowdate = Math.trunc(new Date().valueOf()/1000);

        if (nowdate - mysql_token.getdate > mysql_token.expires){
            return await relogin_osu();
        } else {
            log('Установлен старый осу токен', 'Osu token')
            auth.set_v2(mysql_token.value);
            tokens.osu = {
                value: mysql_token.value,
                type: 'oauth',
                getdate: mysql_token.getdate,
                expires: mysql_token.expires
            };
            return true
        }
    } else {
        return await relogin_osu();
    }

    async function relogin_osu(){
        log('Получение Осу токена');        
        var token = await auth.login_lazer(OSU_LOGIN, OSU_PASSWORD);
        log('Установлен новый Осу токен'); 
        tokens.osu = {
            value: token.access_token,
            type: 'oauth',
            getdate: Math.trunc(new Date().valueOf()/1000),
            expires: token.expires_in
        };
        await MYSQL_SAVE('token', {platform: 'osu'}, tokens.osu);
        return token && token.access_token && token.expires_in?true:false;
    }
}

async function initTwitch(){
    log('Получение Твич токена')
    try{
        var token = await getTwitchToken();
        tokens.twitch = {
            value: token.access_token,
            type: token.token_type,
            getdate: Math.trunc(new Date().valueOf()/1000),
            expires: token.expires_in
        };
        await MYSQL_SAVE('token', {platform: 'twitch'}, tokens.twitch);
    } catch (e){
        console.error('initTwitch', e)
        return false
    }
}

class server {
    constructor (port){
        this.port = port;
        this.app = express();

        this.app.use(express.static(__dirname));
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.get('/', (req, res) => {
            console.log(req.query, res);
            res.send('404');
        });

        this.app.post('/', (req, res) => {
            console.log(req.query, res);
            res.send('404');
        });

        this.app.listen(port, () => {
            log(`twitch chat token callback server listening on port ${port}`, 'twitchchat')
        });
    }
}

//const myserver = new server(3000);

async function getTwitchOauthToken(){
    var token_url = `https://id.twitch.tv/oauth2/authorize?`;
    return new Promise(async (res,rej)=>{
        await axios.get(
            token_url + [
                `response_type=token`,
                `client_id=${TWITCH_CLIENT_ID}`,
                `redirect_uri=http://localhost:3000`,
                `scope=${decodeURI('chat:edit chat:read')}`
            ].join('&'))
        .then(function (response) {
            console.log(response.data)
            LogString(`System`, `info`, `Stalker Twitch Token`,`Логин на твич совершен`);
            res(response.data);
        }).catch(function (error) {
            rej(error.code);
        });
    });
}

async function getTwitchSteamsByCategory({game_id, language}){
    await checkTokenExpires('twitch');
    
    var base_url = 'https://api.twitch.tv';
    var request_url = `/helix/streams?` + [
        `game_id=${game_id}`,
        `type=live`,
        `language=${language}`,
        'first=100'
    ].join('&');

    var request = await axios.create({
        baseURL: base_url,
        url: request_url,
        headers: {
            'Accept': 'application/json',   
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokens.twitch.value}`
        }
    });

    return new Promise(async (res,rej)=>{
        await request.get(`${base_url}${request_url}`).then(function (response) {
            res(GET_VALUES_FROM_OBJECT_BY_KEY(response.data.data, 'user_login'));
        }).catch(function (error) {
            rej(error);
        });
    });
}



async function getTwitchToken(){
    var token_url = `https://id.twitch.tv/oauth2/token`;
    return new Promise(async (res,rej)=>{
        await axios.post(
            token_url, {
                client_id:TWITCH_CLIENT_ID,
                client_secret:TWITCH_CLIENT_SECRET,
                grant_type:'client_credentials'
            }, {headers: {
            'Accept': 'application/json',   
            'client_id': TWITCH_CLIENT_ID,
            'client_secret': TWITCH_CLIENT_SECRET,
            'grant_type': 'client_credentials',
        }})
        .then(function (response) {
            LogString(`System`, `info`, `Stalker Twitch Token`,`Логин на твич совершен`);
            res(response.data);
        }).catch(function (error) {
            rej(error.code);
        });
    });
}

async function getTwitchUserID(username){
    await checkTokenExpires('twitch');

    var url1 = 'https://api.twitch.tv';
    var url2 = `/helix/users?login=${username}`;

    var twitch = await axios.create({
        baseURL: url1,
        url: url2,
        headers: {
            'Accept': 'application/json',   
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokens.twitch.value}`
        }
    });
    
    return new Promise(async (res,rej)=>{
        await twitch.get(`${url1}${url2}`).then(function (response) {
            res( Number(response.data.data[0].id) );
        }).catch(function (error) {
            rej(`twitch check error getTwitchUserID ${error.code}`);
        });
    });
    
}

async function getTwitchUserStatus(usernames){
    var usernames_string = `user_login=`+usernames.join(`&user_login=`);

    await checkTokenExpires('twitch');

    var url1 = 'https://api.twitch.tv';
    var url2 = `/helix/streams?${usernames_string}`;

    var twitch = await axios.create({
        baseURL: url1,
        url: url2,
        headers: {
            'Accept': 'application/json',   
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokens.twitch.value}`
        }
    });

    return new Promise(async (res,rej)=>{
        await twitch.get(`${url1}${url2}`).then(function (response) {
            res(response.data.data);
        }).catch(function (error) {
            switch (error.code){
                case 'ENOTFOUND':
                    rej(`Запрос неудачный: юзер не найден`);
                    break;
                case 'ETIMEDOUT':
                    rej(`Запрос неудачный: превышено время ожидания ответа`);
                    break;
                default:
                    rej(`twitch check error getTwitchUserStatus ${error.code}`);
            }
        });
    });
    
}

async function getTwitchFolowers(TwitchUserID){
    await checkTokenExpires('twitch');

    var url1 = 'https://api.twitch.tv';
    var url2 = `/helix/channels/followers?broadcaster_id=${TwitchUserID}&first=1`;
    
    var twitch = await axios.create({
        baseURL: url1,
        url: url2,
        headers: {
            'Accept': 'application/json',
            'Client-ID': TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${tokens.twitch.value}`
        }
    });
    return await new Promise(async (res,rej)=>{
        await twitch.get(`${url1}${url2}`).then(function (response) {
            res(response.data.total);
        }).catch(function (error) {
            LogString(`System`, `Error`, `Stalker getTwitchFolowers`,`${error.code} ${error.message}`);
            rej(-1);
        });
    });

};

async function getLastTwitchClips(TwitchUserID, days = 1){
    await checkTokenExpires('twitch');
    let url = `https://api.twitch.tv/helix/clips`;

    let meta = { headers: {
        'Accept': 'application/json',
        'Client-Id': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${tokens.twitch.value}`
    }};

    let started_at_date = calculatedate(days);
    
    let start_params = [
        `broadcaster_id=${TwitchUserID}`,
        `started_at=${started_at_date}`,
        `first=20`,
    ];
    return await getClipsRecursive(url, start_params, meta, 1);
}

async function getClipsRecursive(url, params, meta, num){
    return await new Promise(async (res,rej)=>{
        await axios.get(`${url}?${params.join('&')}`, meta).then(async function (response) {
            let allresults = response.data.data;
            if (typeof response.data.pagination.cursor !== 'undefined'){
                let cursor = response.data.pagination.cursor;
                let nextparams = params.slice();
                let i = getIndexInArrayOfStringStartsWith(nextparams, 'after=');
                if (i>-1){
                    nextparams[i] = `after=${cursor}`;
                } else {
                    nextparams.push(`after=${cursor}`);
                }
                
                let lastresult = await getClipsRecursive(url, nextparams, meta,num);
                
                if (lastresult && lastresult.length>0){
                    allresults = allresults.concat(lastresult);
                }
            }
            res(allresults);

        }).catch(function (error) {
            console.log(error)
            LogString(`System`, `Error`, `Stalker`,`${error.code} ${error.message}`);
            rej(-1);
        });
    });
}

function calculatedate(days){
    let now_int = new Date().valueOf();
    let pastdate = new Date(now_int - 86400000 * days);
    return pastdate.toISOString();
}

function getIndexInArrayOfStringStartsWith(arr,str){
    var result = -1;
    for (let i in arr){
        if (arr[i].startsWith(str)){
            result = i;
            break;
        }
    }
    return result;
}


async function getTrovoUserID(username){
    return new Promise(async (res, rej)=>{
        await axios.post(
            `https://open-api.trovo.live/openplatform/getusers`,
            {user:[username]},
            {headers: {'Accept': 'application/json',  'Client-ID': TROVO_CLIENT_ID,}})
        .then(function (response) {
            if(response.data.total>0){
                res(response.data.users[0].channel_id);
            } else {
                rej(0);
            }
        }).catch(function (error) {
            rej (error.code);
        });
    });
}

async function getTrovoUserStatus(username){
    var url1 = 'https://open-api.trovo.live';
    var url2 = '/openplatform/channels/id';
    return new Promise(async (res, rej)=>{
        await axios.post(
            `${url1}${url2}`, 
        {
            "username": username
        },
        {headers: {'Accept': 'application/json',  'Client-ID': TROVO_CLIENT_ID,}})
        .then(function (response) {
            var params = {};
            if (response.data.is_live == true){
                params = {
                    username: response.data.username, 
                    status: 'online',
                    followers: response.data.followers, 
                    cat: response.data.category_name, 
                    title: response.data.live_title,
                };
                
            } else {
                params = {
                    username: response.data.username, 
                    status: 'offline',
                    followers: response.data.followers,
                };
            }
            res(params);
        }).catch(function (error) {
            var errMessage = error.code;
            switch(error.code){
                case 'ENOTFOUND':
                    errMessage += `${username} not found. Will retry after some seconds`;
                break;
                case 'ERR_BAD_RESPONSE':
                    errMessage += `Request of ${username} failed. Will retry after some seconds`;
                break;
                default:
                    console.error(error)
            } 
            
            rej (errMessage);
        });
    });
}

async function getTrovoClips(requestdata){
    return new Promise(async (res, rej)=>{
        await axios.post(
            `https://open-api.trovo.live/openplatform/clips`,
            {
                "channel_id": requestdata.channelid,
                "period": stalkerTrovoClipsPeriod
            },
            {headers: {'Accept': 'application/json',  'Client-ID': TROVO_CLIENT_ID,}})
        .then(function (response) {
            res(response.data.clips_info);
        }).catch(function (error) {
            rej (error.code);
        });
    });
}


async function initSteam(){
    log('Получение Стим токена')
    steam = new SteamAPI(STREAM_API_KEY);
    tokens.steam = {
        value: steam.key,
        type: 'steamapi',
        getdate: Math.trunc(new Date().valueOf()/1000),
        expires: Math.trunc(steam.options.expires/1000)
    };
    await MYSQL_SAVE('token', {platform: 'steam'}, tokens.steam);
}

async function getSteamUserData(users){

    await checkTokenExpires('steam');

    return new Promise(async (res, rej)=>{

        var steamids;

        if (users.username){
            steamids = await new Promise(async (response_steamid, rej) => {
                await steam.get('/ISteamUser/ResolveVanityURL/v0001/?key='+STREAM_API_KEY+'&vanityurl=' + users.username,
                'http://api.steampowered.com', STREAM_API_KEY).then ( result => {
                    if (result.response.steamid) {
                        response_steamid ([result.response.steamid])
                    } else {
                        response_steamid (undefined);
                    }
                })
            });

            if (typeof steamids === 'undefined') {
                console.error('can\'t find user by name ' + users);
                res ([]);
            }
        } else if (users.steamid){
            steamids = [users.steamid];
        } else if (users.ids){
            steamids = users.ids;
        }

        steam.getUserSummary(steamids).then(summaries => {
            var results = [];
            for (summary of summaries) {
                results.push({
                    steamid: summary.steamID,
                    username: summary.nickname,
                    onlinestate: summary.personaState,
                    lastactive: typeof summary.lastLogOff==='undefined'?0:summary.lastLogOff,
                    gameid: typeof summary.gameID==='undefined'?0:summary.gameID,
                    gameinfo: typeof summary.gameExtraInfo==='undefined'?'':summary.gameExtraInfo,
                    url: summary.url
                });
            }
            res (results);
        }).catch (err=>{
            console.log (err.code);
            res ([]);
        });
    });
}


async function getVKUsersData(users_ids){
    var user_ids = users_ids.join(',');
    
    var fields = `online,followers_count,status,last_seen`;
    var vk_url = `https://api.vk.com/method/users.get?user_ids=${user_ids}&fields=${fields}&v=5.131&access_token=${VK_TOKEN}`;
    
    return new Promise (async (res,rej)=> {
        await axios.create().get(vk_url).then(async function (response) {
            if (response.data.error){
                res (response.data.error)
            }
            res (response.data.response);
        }).catch(function (error) {
            rej (error);
        });
    });
}

async function getVKUserFriendsCount(user_id){
    var vk_url = `https://api.vk.com/method/friends.get?user_id=${user_id}&v=5.131&access_token=${VK_TOKEN}`;
    return new Promise (async (res,rej)=> {
        await axios.create().get(vk_url).then(async function (response) {
            res (response.data.response);
        }).catch(function (error) {
            rej (error);
        });
    });
}

async function getVKUserWall(user_id, count=3){
    var vk_url = `https://api.vk.com/method/wall.get?owner_id=${user_id}&v=5.131&access_token=${VK_TOKEN}&count=${count}&extended=1`;
    return new Promise (async (res,rej)=> {
        await axios.create().get(vk_url).then(async function (response) {
            res (response.data.response);
        }).catch(function (error) {
            rej (error);
        });
    });
}

async function getVKClubWall(club_id, count=3){
    var vk_url = `https://api.vk.com/method/wall.get?owner_id=-${club_id}&v=5.131&access_token=${VK_TOKEN}&count=${count}&extended=1`;
    return new Promise (async (res,rej)=> {
        await axios.create().get(vk_url).then(async function (response) {
            res (response.data.response);
        }).catch(function (error) {
            rej (error);
        });
    });
}


module.exports = {
    //getActualTwitchToken: async () => (await MYSQL_GET_ONE('token', {platform: 'twitch'} )).dataValues.value,
    //getTwitchOauthToken: getTwitchOauthToken,

    getTwitchFolowers: getTwitchFolowers,
    getTwitchUserStatus: getTwitchUserStatus,
    getLastTwitchClips: getLastTwitchClips,
    getTwitchUserID: getTwitchUserID, 

    getTwitchSteamsByCategory: getTwitchSteamsByCategory,

    getTrovoUserStatus: getTrovoUserStatus,
    getTrovoUserID: getTrovoUserID,
    getTrovoClips: getTrovoClips,

    getSteamUserData: getSteamUserData,

    getVKUsersData: getVKUsersData,
    getVKUserFriendsCount: getVKUserFriendsCount,
    getVKUserWall: getVKUserWall,
    getVKClubWall: getVKClubWall,

    checkTokenExpires: checkTokenExpires,
};