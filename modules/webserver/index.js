const express = require('express');
const app = express();
const { HTTP_PORT } = require('../../config.js');
const path = require('path');
const bodyParser = require('body-parser')
require('../../settings.js');
const fs = require('fs');
const WebSocket = require('ws');
const webs = new WebSocket.WebSocketServer({ port: 8888 });
const db = require("../../modules/DB.js")

function isJSON(str) {
    try {
        JSON.parse(str.toString());
    } catch (e) {
        return false;
    }
    return true;
}

var main_loop;

var only_tracking = {
    osuprofiles: false,
    steamusers: false,
    trovo_users: false,
    trovo_followers: false,
    trovo_records: false,
    twitch_users: false,
    twitch_followers: false,
    twitch_records: false,
    twitch_clips: false,
    twitch_clips_records: false,
    vk_users: false,
    vk_friends: false,
    youtube: false
}

const tracking_change_deps = [
    {action: 'osuprofile_tracking_change', table_name: 'osuprofile', user_key: 'userid', value_key: 'tracking'},
    {action: 'steamuser_tracking_change', table_name: 'steamuser', user_key: 'steamid', value_key: 'tracking'},
    {action: 'trovo_user_tracking_change', table_name: 'trovodata', user_key: 'userid', value_key: 'tracking'},
    {action: 'trovo_followers_tracking_change', table_name: 'trovodata', user_key: 'userid', value_key: 'followersTracking'},
    {action: 'trovo_user_records_change', table_name: 'trovodata', user_key: 'userid', value_key: 'records'},
    {action: 'twitch_user_tracking_change', table_name: 'twitchdata', user_key: 'userid', value_key: 'tracking'},
    {action: 'twitch_followers_tracking_change', table_name: 'twitchdata', user_key: 'userid', value_key: 'followersTracking'},
    {action: 'twitch_user_records_change', table_name: 'twitchdata', user_key: 'userid', value_key: 'records'},
    {action: 'twitch_user_clips_tracking_change', table_name: 'twitchdata', user_key: 'userid', value_key: 'clipsTracking'},
    {action: 'twitch_user_clips_records_change', table_name: 'twitchdata', user_key: 'userid', value_key: 'clipsRecords'},
    {action: 'vk_user_tracking_change', table_name: 'vkuser', user_key: 'userid', value_key: 'tracking'},
    {action: 'vk_friends_tracking_change', table_name: 'vkuser', user_key: 'userid', value_key: 'friendsTracking'},
    {action: 'youtube_tracking_change', table_name: 'youtubechannel', user_key: 'id', value_key: 'tracking'}
];

const traching_filter_deps = [
    {action: 'osuprofiles_only_tracking', value_key: 'osuprofiles'},
    {action: 'steamuser_only_tracking', value_key: 'steamusers'},
    {action: 'trovo_user_only_tracking', value_key: 'trovo_users'},
    {action: 'trovo_user_only_followers_tracking', value_key: 'trovo_followers'},
    {action: 'trovo_user_only_records', value_key: 'trovo_records'},
    {action: 'twitch_only_tracking', value_key: 'twitch_users'},
    {action: 'twitch_only_followers_tracking', value_key: 'twitch_followers'},
    {action: 'twitch_only_records', value_key: 'twitch_records'},
    {action: 'twitch_only_clips_tracking', value_key: 'twitch_clips'},
    {action: 'twitch_only_clips_records', value_key: 'twitch_clips_records'},
    {action: 'vk_users_only_tracking', value_key: 'vk_users'},
    {action: 'vk_friends_only_tracking', value_key: 'vk_friends'},
    {action: 'youtube_only_tracking', value_key: 'youtube'}
];

module.exports = {
    init: async () => {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.listen(HTTP_PORT, ()=>{
            console.log(`Webserver listening on http://localhost:${HTTP_PORT}!`);
        });

        app.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Address in use, retrying...');
            }
        });

        WebfileListen('/','../../dashboard/index.html');
        WebfileListen('/settings','../../dashboard/index_settings.html');
        WebfileListen('/status','../../dashboard/index_status.html');
        WebfileListen('/status.js','../../dashboard/status.js');
        WebfileListen('/jquery.min.js','../../dashboard/jquery.min.js');
        WebfileListen('/styles.css','../../dashboard/styles.css');
        WebfileListen('/favicon.ico','../../dashboard/favicon.png');

        app.post('/save_settings', async (req, res) => {
            try{
                var settings = {};
                console.log('recev data', req.body)
                settings = req.body;
                console.log('post save_settings', settings);
                fs.writeFileSync('../settings.json', JSON.stringify(settings) );
                console.log('settings saved');
                res.send('settings saved');
            } catch (e){
                console.error(e);
            }
        });

        app.post('/load_all_settings', async (req, res) => {
            try{
                let settings = fs.readFileSync('../settings.json', 'utf-8');
                console.log('post init settings', JSON.parse(settings));
                res.send(JSON.parse(settings));
            } catch (err){
                console.error(err);
                throw new Error(err);
            }
        });

    },

    setDiscordData: async (client) => {
        webs.on('connection', function connection(ws) {
            ws.on('error', console.error);
        
            ws.on('message', async function message(data) {
                console.log('received: %s', data);
                if (isJSON(data)){
                    var data_json = JSON.parse(data);
                    var db_data = data_json.data;
                    if (data_json.action){
                        for (let val of tracking_change_deps) {
                            if (val.action === data_json.action) {
                                await update_db_user_value(val.table_name, val.action, db_data, val.user_key, val.value_key);
                                break;
                            }
                        }

                        for (let val of traching_filter_deps) {
                            if (val.action === data_json.action) {
                                set_only_tracking(val.value_key, db_data);
                                break;
                            }
                        }

                        switch (data_json.action){
                            case 'botchannel_delete':
                                if (typeof db_data.id !== 'undefined' && db_data.id !== null){
                                    console.log('delete bot channel', db_data.id);
                                    await db.MYSQL_DELETE('botchannel', {id: db_data.id});
                                }
                                break;
                            case 'connect':
                                main_loop = setInterval( response, 5000 );
                                break;
                        }
                        response();
                        main_loop.refresh();
                    }
                } else {
                    console.error('"data" is not in JSON format!');
                }
            });

            let response = async () => {
                var guildids = [];
                client.guilds.cache.forEach( async ( guild )=> guildids.push(guild.id) );
                ws.send(JSON.stringify({action:'guildids', data: guildids}) );

                var botchannels = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('botchannel') );
                botchannels = groupBy(botchannels, 'guildid');
                ws.send(JSON.stringify({action:'botchannels', data: botchannels}));

                var osuprofiles = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('osuprofile', get_tracking_multiply(only_tracking, { 
                    osuprofiles: 'tracking'
                }) ));
                ws.send(JSON.stringify({action:'osuprofiles', data: osuprofiles}));

                var steamusers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('steamuser', get_tracking_multiply(only_tracking, { 
                    steamusers: 'tracking'
                }) ));
                ws.send(JSON.stringify({action:'steamusers', data: steamusers}));

                var trovousers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('streamersTrovo', get_tracking_multiply(only_tracking, { 
                    trovo_users: 'tracking', 
                    trovo_followers: 'followersTracking',
                    trovo_records: 'records'
                }) ));
                ws.send(JSON.stringify({action:'trovousers', data: trovousers}));

                var twitchusers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('streamersTwitch', get_tracking_multiply(only_tracking, { 
                    twitch_users: 'tracking', 
                    twitch_followers: 'followersTracking',
                    twitch_records: 'records',
                    twitch_clips: 'clipsTracking',
                    twitch_clips_records: 'clipsRecords' 
                }) ));
                ws.send(JSON.stringify({action:'twitchusers', data: twitchusers}));

                var vkusers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('vkuser', get_tracking_multiply(only_tracking, { 
                    vk_users: 'tracking', 
                    vk_friends: 'friendsTracking'
                }) ));
                ws.send(JSON.stringify({action: 'vkusers', data: vkusers}));

                var youtube_users = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('youtubechannel', get_tracking_multiply(only_tracking, { 
                    youtube: 'tracking'
                }) ));
                ws.send(JSON.stringify({action: 'youtube_users', data: youtube_users}));
            }
        
        });
        
    }
}

function WebfileListen(link, filepath){
    app.get(link, (req, res) => {
        res.sendFile(path.join(__dirname, filepath));
    });
}

function groupBy(collection, property) {
    var i = 0, val, index,
        values = [], result = [];
    for (; i < collection.length; i++) {
        val = collection[i][property];
        index = values.indexOf(val);
        if (index > -1)
            result[index].push(collection[i]);
        else {
            values.push(val);
            result.push([collection[i]]);
        }
    }
    return result;
}

async function update_db_user_value(tablename, action, db_data, user_key, value_key) {
    if (typeof db_data.userid === 'undefined' || typeof db_data.value === 'undefined' || 
    db_data.userid === null || db_data.value === null ||
    typeof value_key === 'undefined' || value_key === null ||
    typeof user_key === 'undefined' || user_key === null ){
        console.error('undefined data', db_data, user_key, value_key);
        return false;
    }
    console.log(action,  db_data.userid, db_data.value);
    await db.MYSQL_SAVE(tablename, { [user_key]: db_data.userid }, {[value_key]: db_data.value} );

}

function set_only_tracking (value_key, data) {
    if (typeof data.value === 'undefined' || data.value === null || typeof value_key === 'undefined' || value_key === null) {
        console.error('undefined data', data, value_key);
    }
    only_tracking[value_key] = data.value;
}

function get_tracking_multiply(obj, props){
    var res = {};
    Object.entries(props).forEach( val => {
        if (obj[val[0]] == true){
            res[val[1]] = true;
        }
    });
    return res;
}