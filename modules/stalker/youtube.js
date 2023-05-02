const Google = require('googleapis').google;
const Youtube = Google.youtube("v3");
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const { MYSQL_SAVE, MYSQL_GET_ALL, MYSQL_GET_ONE, MYSQL_GET_ALL_RESULTS_TO_ARRAY, 
    manageGuildServiceTracking, getTrackingUsersForGuild, getGuildidsOfTrackingUserService } = require("../DB.js");

const { SendAnswer } = require("../../tools/embed.js");
const { CreateFolderSync_IsNotExists } = require('../../modules/tools.js');
const { getDiscordRelativeTime } = require('../../tools/time.js');
const { log } = require("../../tools/log.js");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require('../../modules/tools.js');

const { youtube_scopes } = require('../../settings.js');
const { emoji_youtube } = require("../../constantes/emojis.js");

const moduleName = `Stalker Youtube`;

var youtube_client_secret_path = './youtube-data/youtube_client_secret';
var youtube_tokens_path = './youtube-data/youtube-tokens.json';

var google_client_data = {
    client_id: '',
    client_secret: '',
    redirect_url: '',
    oauth2Client: undefined,
    tokens: {}
}

class server {
    constructor (port){
        this.port = port;
        this.app = express();

        this.app.use(express.static(__dirname));
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.get('/', (req, res) => {
            console.log('404 get');
            res.send('404');
        });

        this.app.post('/', (req, res) => {
            console.log('404 post');
            res.send('404');
        });


        this.app.get('/oauth2callback', async (req, res) => {
            async function getTokenByCode(code){
                if (code){
                    try{
                        var tokens = await google_client_data.oauth2Client.getToken(code);
                    } catch (e){
                        console.log('get token error: ',e.code, e.response.data.error_description);
                        return false;
                    }
                    if (tokens && tokens.res && tokens.res.status){
                        return tokens.tokens;
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            }

            if (req && req.query && req.query.code){
                let tokens = await getTokenByCode(req.query.code);
                if (tokens) {
                    google_client_data.tokens = tokens;
                    savetokens(tokens);
                } else {
                    console.log('tokens request error');
                }
            } else {
                console.log('/oauth2callback get error\n',req,res);
            }
            
        });

        this.app.post('/oauth2callback', (req, res) => {
            if (res && res.token_type){
                if (res.token_type === 'Bearer'){
                    console.log('authorise complete');
                    res.send('authorise complete');
                } else {
                    console.log('wrong token type');
                }
            } else {
                console.log('/oauth2callback post error\n',req,res);
            }
            
        });

        this.app.listen(port, () => {
            log(`Youtube token callback server listening on port ${port}`,moduleName)
        });
    }
}

function getLastClientSecret(){
    try{
        if (!CreateFolderSync_IsNotExists(youtube_client_secret_path)){ return false };
        var files = fs.readdirSync(youtube_client_secret_path);
        if (files.length>0){
            var last_filename = '';
            var last_file_ms = 0; 
            //find last client sercet file
            for (let client_secret_file of files){
                let file = fs.openSync(`${youtube_client_secret_path}/${client_secret_file}`);
                let timems = Number(fs.fstatSync(file).birthtimeMs);
                if (timems>last_file_ms){
                    last_file_ms = timems;
                    last_filename = `${youtube_client_secret_path}/${client_secret_file}`;
                };
                fs.closeSync(file);
            }
            //load
            var res = JSON.parse(fs.readFileSync(last_filename, {encoding:'utf-8'}));

            google_client_data.client_id = res.web.client_id;
            google_client_data.client_secret = res.web.client_secret;
            google_client_data.redirect_url = res.web.redirect_uris[0];

            if ((res && res.web && res.web.client_id)&&
                (res && res.web && res.web.client_secret)&&
                (res && res.web && res.web.redirect_uris && res.web.redirect_uris[0]) ){                
                    log('Учетные данные загружены', moduleName);
            };

            google_client_data.oauth2Client = new Google.auth.OAuth2(google_client_data.client_id, google_client_data.client_secret, google_client_data.redirect_url);
            
            return true
        } else {
            return false;
        }
    } catch (e){
        console.log(e);
    }
}

function loadtokens (){
    try{
        var tokens = fs.readFileSync(youtube_tokens_path,'utf-8');
        google_client_data.tokens = JSON.parse(tokens);
        google_client_data.oauth2Client.credentials = google_client_data.tokens;
        log('Токены загружены'+youtube_tokens_path, moduleName);
    } catch (e){
        if (e.code === 'ENOENT'){
            console.log('Файла токенов не существует');
            let authURL = google_client_data.oauth2Client.generateAuthUrl({access_type: 'offline', scope: youtube_scopes});
            console.log(`Пройдите по ссылке и авторизуйте приложение:\n${authURL}`);
        } else {
            console.log('load tokens: unexpected error ',e.code);
            console.log(e);
            return
        }
        
    }
};

function savetokens(tokens){
    log('сохраняем новые токены...'+youtube_tokens_path, moduleName);
    fs.writeFileSync(youtube_tokens_path, JSON.stringify(tokens),'utf-8');
    google_client_data.oauth2Client.credentials = google_client_data.tokens;
    log('Сохранены новые токены'+youtube_tokens_path, moduleName);
};

async function init(){
    const clientSecretComplete = getLastClientSecret();
    if (!clientSecretComplete){
        log('не найден файл с секретом, войдите и скачайте заново: https://console.cloud.google.com/apis/credentials', moduleName);
        return false;
    }
    const myserver = new server(3333);
    loadtokens();
    log(moduleName+' запущен', moduleName);
}

async function getVideosByPlaylistId(playlistid){
    return new Promise((res,rej)=>{
        Youtube.playlistItems.list({
            auth: google_client_data.oauth2Client,
            part: 'snippet,contentDetails',
            maxResults: 3,
            playlistId: playlistid
        }, function(err, response) {

            if (err) {
            //console.log('The API returned an error: ' + err);
            rej(err)
            return;
            }

            var response_data = response.data.items;
            if (!response_data || response_data.length == 0) {
                res({error: `no videos founded in playlist ${playlistid}`});
            } else {
                res(getVideoListResultsOfPlaylistItems(response_data));
            }
        });
    });
}

async function getChannelInfoByName(channel_name){
    return new Promise((res,rej)=>{
        
    Youtube.search.list({
        auth: google_client_data.oauth2Client,
        part: 'id,snippet',
        q: channel_name,
        order: 'relevance',
        type: 'channel',
        maxResults: 1
      }, function(err, response) {

        if (err) {
            //console.log('The API returned an error: ' + err);
            rej(err)
            return;
        }

        var response_data = response.data.items;
        if (!response_data || response_data.length == 0) {
            res({error: 'no channels with '+channel_name});
        } else {
            res(getChannelInfoResult(response_data[0]));
        }
    });
    });
}

function getChannelInfoResult(data){
    return {
        id: data.id.channelId, 
        title: data.snippet.title, 
        icons: data.snippet.thumbnails,
        creation_date: Math.trunc(new Date(data.snippet.publishTime).valueOf()*0.001),
    }
}

function getVideoListResultsOfPlaylistItems(response_data){
    var results = [];
    for (let data of response_data){
        results.push({
            channel: {id: data.snippet.channelId, title: data.snippet.channelTitle},
            id: data.snippet.resourceId.videoId,
            title: data.snippet.title,
            date: Math.trunc(new Date(data.snippet.publishedAt).valueOf()*0.001),
            previews: data.snippet.thumbnails
        });
    }
    return results;
}

async function MYSQL_TRACK_NEW_YOUTUBE_USER (channeldata){
    return await MYSQL_SAVE('youtubechannel', { channelid: channeldata.id }, {
        channelname: channeldata.title, 
        icons_default: channeldata.icons.default.url, 
        icons_medium: channeldata.icons.medium.url, 
        icons_high: channeldata.icons.high.url, 
        creation_date: channeldata.creation_date,
        tracking: true
    });
}

module.exports = {
    init: init,

    MYSQL_YOUTUBE_USER_TRACKING_CHANGE: async function(message, searchname, option){
        //проверка юзера и создаание нового юзера
        try{
            var channeldata = await getChannelInfoByName(searchname);
            if (channeldata.error){
                return {success: false, text: channeldata.error}
            }
        } catch (e){
            return {success: false, text: `API Error: ${e.code}`}
        }
        var userdata = await MYSQL_GET_ONE('youtubechannel', {channelname: channeldata.title});
        if (userdata === null ) {
            let success = await MYSQL_TRACK_NEW_YOUTUBE_USER(channeldata);
            if (!success) {
                return {success: false, text: `(Youtube) Не удалось сохранить канал в базу`}
            } else {
                userdata = success.dataValues;
            }
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'youtube', option.action, option.value, ['channelid', channeldata.id], 'youtubechannel');                
                break;
            default:
                throw new Error('unexpected error: undefined action');
        }
        return {success: true, text: `Youtube channel **${channeldata.title}** set **${option.action}** is **${option.value}**`}
    },
    
    YOUTUBE_TRACKING_INFO: async function (message){
        var mysql_data = await getTrackingUsersForGuild(message.guild.id, 'youtube_tracking', 'youtubechannel');
        if (mysql_data.length>0){
            let MessageFields = [];
            var usernamesFields = '';
            var useridsFields = '';
            for (let userdata of mysql_data){
                useridsFields += `${userdata.channelid.toString()}\n`;
                usernamesFields += `${userdata.channelname.toString()}\n`;
            }
            MessageFields.push ({name: 'Channel ID', value: useridsFields, inline: true});
            MessageFields.push ({name: 'Channel Name', value: usernamesFields, inline: true});
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_youtube} ${moduleName}`,
                text: `Tracking channels info`,
                fields: MessageFields} );

        } else {
            await SendAnswer( {channel:  message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: `${emoji_youtube} ${moduleName}`,
                text: `No tracking channels`} );
        }
    },

    checkYoutubeVideos: async function (stalkerEvents){
        log('Проверка статуса Youtube каналов', moduleName);
        var AllUsersYoutubeDataFromDB = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('youtubechannel'));
        if (AllUsersYoutubeDataFromDB.length > 0){
            for (let YoutubeChannelData of AllUsersYoutubeDataFromDB){
                if (YoutubeChannelData.updoads_playlistid){
                    var playlistid = YoutubeChannelData.updoads_playlistid;
                } else {
                    //получаем плейлист айди
                    var playlistid = await getChannelPlaylistId({id: YoutubeChannelData.channelid});
                    if (!playlistid){
                        log('no uploads playlist for '+YoutubeChannelData.channelname, moduleName);
                        continue;
                    }
                    await MYSQL_SAVE('youtubechannel', { channelid: YoutubeChannelData.channelid }, {updoads_playlistid: playlistid});
                }
                var videos = await getVideosByPlaylistId(playlistid);
                if (!videos){
                    log('youtube videos get error');
                    return false;
                }
                let trackingsGuilds = await getGuildidsOfTrackingUserService('youtube_tracking',YoutubeChannelData.channelid);
                for (let videodata of videos){
                    let video_mysql_data = await MYSQL_GET_ONE('youtubevideos', {videoid: videodata.id} );
                    if (video_mysql_data === null ) {
                        let newVideoText = `Канал **[${videodata.channel.title}](https://www.youtube.com/channel/${videodata.channel.id})** выпустил новое видео!\n`;
                        newVideoText += `Название: **[${videodata.title}](https://www.youtube.com/watch?v=${videodata.id})**\n`;
                        newVideoText += `Дата: ${getDiscordRelativeTime( videodata.date*1000 )}\n`;
                        await MYSQL_SAVE('youtubevideos', {videoid: videodata.id}, {
                            videotitle: videodata.channel.title,
                            preview_default: videodata.previews.default.url,
                            preview_medium: videodata.previews.medium.url,
                            preview_high: videodata.previews.high.url,
                            date: videodata.date
                        });
                        
                        await stalkerEvents.emit('YoutubeChanges', {guildids: trackingsGuilds, text: newVideoText, username: videodata.channel.title, channelid: videodata.channel.id, image: videodata.previews.high.url});
                        
                    }
                }
            }
        }
    },

};


function getChannelPlaylistId(params){
    return new Promise ((res,rej)=> {
        var query = {
            auth: google_client_data.oauth2Client,
            part: 'contentDetails',
        };
        if (params.id){
            query.id = params.id;
        }
        if (params.customurl){
            query.forUsername = params.customurl;
        }
        Youtube.channels.list(query, function(err, response) {
            if (err) {
                rej(err);
                return;
            }
            var channels = response.data.items;
            if (!channels || channels.length == 0) {
                res({error:'No channel found.'});
            } else {
                res(channels[0].contentDetails.relatedPlaylists.uploads);
            }
        });
    });
}
