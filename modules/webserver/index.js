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
    twitch_clips_records: false
}

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
                    console.log('action', data_json.action);
                    if (data_json.action){
                        switch (data_json.action){
                            case 'botchannel_delete':
                                if (db_data.id !== undefined){
                                    console.log('delete bot channel', db_data.id);
                                    await db.MYSQL_DELETE('botchannel', {id: db_data.id});
                                }
                                break;
                            case 'osuprofile_tracking_change':
                                await update_db_user_value('osuprofile', data_json.action, db_data, 'userid', 'tracking');
                                break;
                            case 'osuprofiles_only_tracking':                                
                                set_only_tracking('osuprofiles', db_data);
                                break;
                            case 'steamuser_tracking_change':
                                await update_db_user_value('steamuser', data_json.action, db_data, 'steamid', 'tracking');
                                break;
                            case 'steamuser_only_tracking':
                                set_only_tracking('steamusers', db_data);
                                break;
                            case 'trovo_user_tracking_change':
                                await update_db_user_value('trovodata', data_json.action, db_data, 'userid', 'tracking');
                                break;
                            case 'trovo_user_only_tracking':
                                set_only_tracking('trovo_users', db_data);
                                break;
                            case 'trovo_followers_tracking_change':
                                await update_db_user_value('trovodata', data_json.action, db_data, 'userid', 'followersTracking');
                                break;
                            case 'trovo_user_only_followers_tracking':
                                set_only_tracking('trovo_followers', db_data);
                                break;
                            case 'trovo_user_records_change':
                                await update_db_user_value('trovodata', data_json.action, db_data, 'userid', 'records');
                                break;
                            case 'trovo_user_only_records':
                                set_only_tracking('trovo_records', db_data);
                                break;
                            case 'twitch_only_tracking':
                                set_only_tracking('twitch_users', db_data);
                                break;
                            case 'twitch_only_followers_tracking':
                                set_only_tracking('twitch_followers', db_data);
                                break;
                            case 'twitch_only_records':
                                set_only_tracking('twitch_records', db_data);
                                break;
                            case 'twitch_only_clips_tracking':
                                set_only_tracking('twitch_clips', db_data);
                                break;
                            case 'twitch_only_clips_records':
                                set_only_tracking('twitch_clips_records', db_data);
                                break;
                            case 'twitch_user_tracking_change':
                                await update_db_user_value('twitchdata', data_json.action, db_data, 'userid', 'tracking');
                                break;
                            case 'twitch_followers_tracking_change':
                                await update_db_user_value('twitchdata', data_json.action, db_data, 'userid', 'followersTracking');
                                break;
                            case 'twitch_user_records_change':
                                await update_db_user_value('twitchdata', data_json.action, db_data, 'userid', 'records');
                                break;
                            case 'twitch_user_clips_tracking_change':
                                await update_db_user_value('twitchdata', data_json.action, db_data, 'userid', 'clipsTracking');
                                break;
                            case 'twitch_user_clips_records_change':
                                await update_db_user_value('twitchdata', data_json.action, db_data, 'userid', 'clipsRecords');
                                break;

                            case 'connect':
                                main_loop = setInterval( response, 5000 );
                                break;
                            default:
                                console.log('undefined action');
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

                var osuprofiles_tracking = {};
                if (only_tracking.osuprofiles == true) {
                    osuprofiles_tracking.tracking = true;
                }
                var osuprofiles = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('osuprofile', osuprofiles_tracking) );
                ws.send(JSON.stringify({action:'osuprofiles', data: osuprofiles}));

                var steamusers_tracking = {};
                if (only_tracking.steamusers == true) {
                    steamusers_tracking = {tracking: true}
                }
                var steamusers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('steamuser', steamusers_tracking) );
                ws.send(JSON.stringify({action:'steamusers', data: steamusers}));

                var trovo_users_tracking = {};
                if (only_tracking.trovo_users == true) {
                    trovo_users_tracking.tracking = true;
                }
                if (only_tracking.trovo_followers == true) {
                    trovo_users_tracking.followersTracking = true;
                }
                if(only_tracking.trovo_records == true) {
                    trovo_users_tracking.records = true;
                }
                var trovousers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('streamersTrovo', trovo_users_tracking) );
                ws.send(JSON.stringify({action:'trovousers', data: trovousers}));

                var twitch_users_tracking = {};
                if (only_tracking.twitch_users == true) {
                    twitch_users_tracking.tracking = true;
                }
                if (only_tracking.twitch_followers == true) {
                    twitch_users_tracking.followersTracking = true;
                }
                if(only_tracking.twitch_records == true) {
                    twitch_users_tracking.records = true;
                }
                if(only_tracking.twitch_clips == true) {
                    twitch_users_tracking.clipsTracking = true;
                }
                if(only_tracking.twitch_clips_records == true) {
                    twitch_users_tracking.clipsRecords = true;
                }
                var twitchusers = db.MYSQL_GET_ALL_RESULTS_TO_ARRAY (await db.MYSQL_GET_ALL('streamersTwitch', twitch_users_tracking) );
                ws.send(JSON.stringify({action:'twitchusers', data: twitchusers}));
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
    if (db_data.userid !== undefined && db_data.value !== undefined){
        console.log(action,  db_data.userid, db_data.value);
        await db.MYSQL_SAVE(tablename, { [user_key]: db_data.userid }, {[value_key]: db_data.value} );
    }
}

function set_only_tracking (value_key, data) {
    if (data.value !== undefined) {
        only_tracking[value_key] = data.value;
    }
}

