const express = require('express');
const { WEBSETTINGS_HTTP_PORT, WEBSETTINGS_SOCKET_PORT } = require('../../config.js');
const path = require('path');
const bodyParser = require('body-parser')
require('../../settings.js');
const fs = require('fs');
const WebSocket = require('ws');
const { MYSQL_GET_TRACKING_DATA_BY_ACTION, MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ALL, MYSQL_DELETE, MYSQL_SAVE } = require("../../modules/DB.js");
const { log } = require("../../tools/log.js");
const { isJSON, groupBy, listenWebFolder, listenWebFile } = require('../tools.js');

var app = express();
const webs = new WebSocket.WebSocketServer({ port: WEBSETTINGS_SOCKET_PORT });

var main_loop;

var clients = [];

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
    {action: 'youtube_tracking_change', table_name: 'youtubechannel', user_key: 'id', value_key: 'tracking'},
    {action: 'twitchchat_tracking_change', table_name: 'twitchchat', user_key: 'id', value_key: 'tracking'}
];

const tracking_filter_deps = [
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
    {action: 'youtube_only_tracking', value_key: 'youtube'},
    {action: 'twitchchat_only_tracking', value_key: 'twitchchat'}
];

const db_data_deps = [
    {tablename: 'osuprofile', action: 'osuprofiles', tracking_props: {osuprofiles: 'tracking'} },
    {tablename: 'steamuser', action: 'steamusers', tracking_props: {steamusers: 'tracking'} },
    {tablename: 'streamersTrovo', action: 'trovousers', tracking_props: {trovo_users: 'tracking', 
    trovo_followers: 'followersTracking', trovo_records: 'records'} },
    {tablename: 'streamersTwitch', action: 'twitchusers', tracking_props: {twitch_users: 'tracking', twitch_followers: 'followersTracking',
    twitch_records: 'records', twitch_clips: 'clipsTracking', twitch_clips_records: 'clipsRecords' } },
    {tablename: 'vkuser', action: 'vkusers', tracking_props: {vk_users: 'tracking', vk_friends: 'friendsTracking'} },
    {tablename: 'youtubechannel', action: 'youtube_users', tracking_props: {youtube: 'tracking'} },
    {tablename: 'twitchchat', action: 'twitchchat', tracking_props: {twitchchat: 'tracking'} }
];

const public_path = 'data/websettings_public/';

module.exports = {
    init: async () => {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.listen(WEBSETTINGS_HTTP_PORT, ()=>{
            log(`Websettings server listening on http://localhost:${WEBSETTINGS_HTTP_PORT}!`, 'Dashboard');
        });

        app.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Address in use, retrying...');
            }
        });

        app.use(express.static(path.join(__dirname, '/../../', public_path)));

        listenWebFile( '/settings', path.join(public_path, 'index_settings.html'), app);
        listenWebFile( '/status', path.join(public_path, 'index_status.html'), app);
        listenWebFile( '/favicon.ico', path.join(public_path, 'favicon.png'), app);

        app.post('/save_settings', async (req, res) => {
            try{
                var settings = {};
                settings = req.body;
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
                res.send(JSON.parse(settings));
            } catch (err){
                console.error(err);
                throw new Error(err);
            }
        });

    },

    setDiscordData: async (client) => {
        webs.on('connection', function connection(ws) {
            ws.id = new Date().getTime();
            log('new connection, id: '+ws.id, 'Dashboard');

            ws.tracking_filter = {
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
                youtube: false,
                twitchchat: false
            }

            clients.push(ws);

            ws.on('error', console.error);
        
            ws.on('close', ()=> {
                log('connection closed, id: '+ws.id, 'Dashboard');
                for (let i in clients){
                    if (clients[i].id === ws.id){
                        clients.splice(i, 1);
                    }
                }
            });

            ws.on('message', async function message(data) {
                log('received: '+data, 'Dashboard');
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

                        for (let val of tracking_filter_deps) {
                            if (val.action === data_json.action) {
                                set_tracking_filter(ws.id, val.value_key, db_data);
                                break;
                            }
                        }

                        switch (data_json.action){
                            case 'botchannel_delete':
                                if (typeof db_data.id !== 'undefined' && db_data.id !== null){
                                    log('delete bot channel'+db_data.id, 'Dashboard');
                                    await MYSQL_DELETE('botchannel', {id: db_data.id});
                                }
                                break;
                            case 'connect':
                                main_loop = setInterval( response, 5000 );
                                break;
                            case 'bot_restart':
                                throw new Error('restart');
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

                var botchannels = await MYSQL_GET_TRACKING_DATA_BY_ACTION('botchannel');
                botchannels = groupBy(botchannels, 'guildid');
                ws.send(JSON.stringify({action:'botchannels', data: botchannels}));

                for (let data of db_data_deps){
                    await send_db_data(ws, data.tablename, data.action, data.tracking_props);
                }
            }
        });
    }
}

async function update_db_user_value(tablename, action, db_data, user_key, value_key) {
    if (typeof db_data.userid === 'undefined' || typeof db_data.value === 'undefined' || 
    db_data.userid === null || db_data.value === null ||
    typeof value_key === 'undefined' || value_key === null ||
    typeof user_key === 'undefined' || user_key === null ){
        console.error('undefined data', db_data, user_key, value_key);
        return false;
    }
    await MYSQL_SAVE(tablename, { [user_key]: db_data.userid }, {[value_key]: db_data.value} );
}

function set_tracking_filter (ws_id, value_key, data) {
    if (typeof data.value === 'undefined' || data.value === null || typeof value_key === 'undefined' || value_key === null) {
        console.error('undefined data', data, value_key);
    }

    for (let i in clients){
        if (clients[i].id === ws_id){
            clients[i].tracking_filter[value_key] = data.value;
        }
    }
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

async function send_db_data(conn, tablename, action, tracking_props) {
    let data = MYSQL_GET_ALL_RESULTS_TO_ARRAY (await MYSQL_GET_ALL(tablename, get_tracking_multiply(conn.tracking_filter, tracking_props)));
    conn.send(JSON.stringify({action, data}));
}
