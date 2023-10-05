const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require("../config.js");
const { coins_max } = require("../settings.js");

const { LogString, log } = require("../tools/log.js");
const { SendAnswer } = require("../tools/embed.js");

const { Sequelize, DataTypes, Op } = require('@sequelize/core');
const { table_id_names } = require("../constantes/table_id_names.js");

const mysql = new Sequelize( DB_NAME, DB_USER, DB_PASSWORD, { 
    dialect: `mysql`,
    define: {
        updatedAt: false,
        createdAt: false,
        deletedAt: false
    },
});

const moduleName = 'Datebase';

const User = mysql.define ('user', {
    guildid: { type: DataTypes.STRING, unique: `guilduser`, allowNull: false },
    userid: { type:DataTypes.STRING, unique: `guilduser`, allowNull: false },
    restricted: {type: DataTypes.BOOLEAN, defaultValue: false },
    coins: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastdaily: { type: DataTypes.DATE, defaultValue: 0 },//DataTypes.NOW - daily_waittime_ms - 1000
    dailynotified: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Role = mysql.define ('role', {
    guildid: { type: DataTypes.STRING, unique: `guildrole`, allowNull: false },
    roleid: { type: DataTypes.STRING, unique: `guildrole`, allowNull: false },
    price: { type: DataTypes.INTEGER, defaultValue: -1 },
    chanid: { type:DataTypes.STRING, defaultValue: '0' },
});

const ReactionRole = mysql.define ('reactionrole', {
    guildid: { type: DataTypes.STRING, unique: `message`, allowNull: false },
    messageid: { type:DataTypes.STRING, unique: `message`, allowNull: false },
    emoji: { type:DataTypes.STRING, unique: `message`, allowNull: false },
    emojitype: { type:DataTypes.STRING, allowNull: false },
    roleid: { type:DataTypes.STRING, allowNull: false },
});

const Remind = mysql.define ('remind', {
    guildid: { type: DataTypes.STRING, unique: `remind`, allowNull: false },
    userid: { type:DataTypes.STRING, unique: `remind`, allowNull: false },
    text: { type:DataTypes.STRING,  unique: `remind`, allowNull: false },
    time: { type:DataTypes.DATE,  allowNull: false },
    timeMin: { type:DataTypes.INTEGER,  defaultValue: 1 },
    infinity: { type:DataTypes.BOOLEAN,  defaultValue: false },
});

const BotChannel = mysql.define ('botchannel', {
    guildid: { type: DataTypes.STRING, unique: `message`, allowNull: false },
    channeltype: { type: DataTypes.STRING, unique: `message`, allowNull: false },
    channelid: { type:DataTypes.STRING,   allowNull: false }
});

const TwitchData = mysql.define ('twitchdata', {
    username: {type: DataTypes.STRING, unique: true, allowNull: false},
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    tracking: {type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false},
    followers: {type: DataTypes.INTEGER, defaultValue: 0, allowNull: false},
    status:  {type:DataTypes.STRING, defaultValue: `offline`, allowNull: false},
    title:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    cat:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    followersTracking: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false},
    clipsTracking: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false},
    records: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false},
    clipsRecords: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false},
});

const TwitchClips = mysql.define ('twitchclips', {
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    clipid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const TrovoClips = mysql.define ('trovoclips', {
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    clipid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const SteamUserData = mysql.define ('steamuser', {
    tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
    steamid: {type: DataTypes.STRING,  defaultvalue: 0, allowNull: false},
    onlinestate: {type: DataTypes.INTEGER,  defaultvalue: '', allowNull: false},
    username: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    lastactive: {type: DataTypes.INTEGER},
    gameid: {type: DataTypes.INTEGER,  defaultvalue: 0},
    gameinfo: {type: DataTypes.STRING,  defaultvalue: ''},
    url: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const TrovoData = mysql.define ('trovodata', {
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    username: {type: DataTypes.STRING, unique: true, allowNull: false},
    tracking: {type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false},
    followers: {type: DataTypes.INTEGER, defaultValue: 0, allowNull: false},
    status:  {type:DataTypes.STRING, defaultValue: `offline`, allowNull: false},
    title:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    cat:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    followersTracking: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false},
    records: {type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false},
});

const VKUserData = mysql.define ('vkuser', {
    tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    online: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
    name1: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    name2: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    lastactive: {type: DataTypes.INTEGER, defaultvalue: 0, allowNull: false},
    statustext: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    followers: {type: DataTypes.INTEGER, defaultvalue: 0, allowNull: false},
    friends: {type: DataTypes.INTEGER, defaultvalue: 0, allowNull: false},
    friendsTracking:  {type: DataTypes.BOOLEAN,  defaultvalue: false, allowNull: false},
});

const VKUserFriendData = mysql.define ('vkfriend', {
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    friendid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
});

/*
const VKUserPostData = mysql.define ('vkpost', {
    postid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    text: {type: DataTypes.TEXT,  defaultvalue: '', allowNull: false},
    date: {type: DataTypes.DATE,  defaultvalue: '', allowNull: false},

});*/

const TwitchChatData = mysql.define ('twitchchat', {
    username: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
});

const OsuProfileData = mysql.define ('osuprofile', {
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    username: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    pp: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    rank: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    countryrank: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    acc: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    lastactive: {type: DataTypes.INTEGER, defaultvalue: 0, allowNull: false},
    online: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
    followers: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    tracking: {type: DataTypes.BOOLEAN,  defaultvalue: 1, allowNull: false},
    mainmode: {type: DataTypes.STRING,  defaultvalue: 'osu', allowNull: false},
    avatar: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const OsuActivity = mysql.define ('osuactivity', {
    activityid: {type: DataTypes.BIGINT,  defaultvalue: 0, allowNull: false},
    date: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    type: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
});

const OsuScoreData = mysql.define ('osuscore', {
    scoreid: {type: DataTypes.BIGINT,  defaultvalue: 0, allowNull: false},
    date: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    username: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    gamemode: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    mapsetid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    mapid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    score300: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    score100: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    score50: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    score0: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    artist: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    title: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    diff: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    pp: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    acc: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    rank: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    mods: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const YoutubeChannelsData = mysql.define ('youtubeChannelsData', {
    channelid: {type: DataTypes.STRING,  defaultvalue: ``, unique: true, allowNull: false},
    channelname: {type: DataTypes.STRING, defaultvalue: ``, allowNull: false},
    icons_default:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    icons_medium:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    icons_high: {type: DataTypes.STRING, defaultValue: ``, allowNull: false},
    creation_date: {type: DataTypes.INTEGER, defaultValue: 0, allowNull: false},
    updoads_playlistid:{type: DataTypes.STRING, defaultValue: ``, allowNull: false},
    tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
});

const YoutubeVideosData = mysql.define ('youtubeVideosData', {
    videoid: {type: DataTypes.STRING, defaultValue: '0', unique: true, allowNull: false},
    videotitle: {type: DataTypes.STRING, defaultValue: '', allowNull: false},
    preview_default:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    preview_medium:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
    preview_high: {type: DataTypes.STRING, defaultValue: ``, allowNull: false},
    date:  {type:DataTypes.INTEGER, defaultValue: 0, allowNull: false},
});

const Token = mysql.define ('token', {
    value: {type: DataTypes.TEXT,  defaultvalue: '', allowNull: false},
    platform: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    getdate: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    expires: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    type: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const guildServicesTracking = mysql.define ('guildServicesTracking', {
    guildid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    platformaction: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    key: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
});

const replayCache = mysql.define ('osureplaycache', {
    replay_md5: {type: DataTypes.STRING,  unique: true, defaultvalue: '', allowNull: false},
    replayJSONdata: {type: DataTypes.JSON,  defaultvalue: '', allowNull: false},
});

const replayAttachment = mysql.define ('osureplayattachment', {
    imageid: {type: DataTypes.BIGINT,  unique: true, defaultvalue: 0, allowNull: false},
    userid: {type: DataTypes.BIGINT,  defaultvalue: 0, allowNull: false},
    beatmap_md5: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    replay_md5: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    time: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    zoom: {type: DataTypes.INTEGER,  defaultvalue: 400, allowNull: false},
});

const nibbers = mysql.define ('nibbers', {
    userid: {type: DataTypes.BIGINT, unique: true, defaultvalue: 0, allowNull: false},
    nibbers: {type: DataTypes.BIGINT, defaultvalue: 0, allowNull: false},
});

const guildSettings = mysql.define ('guildSettings', {
    guildid: {type: DataTypes.BIGINT, defaultvalue: 0, allowNull: false},
    settingname: {type: DataTypes.STRING, defaultvalue: '', allowNull: false},
    value: {type: DataTypes.STRING, defaultvalue: '', allowNull: false},
});

const osuHunterTrackingUser = mysql.define ('osuHunterTrackingUser', {
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    lastUpdated: {type: DataTypes.DATEONLY,  defaultvalue: false, allowNull: false},    
});

const cryptopairs = mysql.define ('cryptopairs', {
    first: {type: DataTypes.STRING, allowNull: false},
    second: {type: DataTypes.STRING, allowNull: false},
    value: {type: DataTypes.DOUBLE, defaultValue: 0.0},
    value_change: {type: DataTypes.DOUBLE, defaultValue: 0.0},
    is_online: {type: DataTypes.BOOLEAN, defaultValue: false},
    last_update: {type: DataTypes.DATE, allowNull: false}
});

const authorizedMailUsers = mysql.define ('authorizedMailUsers', {
    ip: {type: DataTypes.STRING, allowNull: false},
    token: {type: DataTypes.STRING, allowNull: false},
});

const mail_contents = mysql.define ('mail_contents', {
    unique_key: {type: DataTypes.STRING, allowNull: false, unique: true}, 
    addressee: {type: DataTypes.STRING, allowNull: false}, 
    from: {type: DataTypes.STRING, allowNull: false},
    subject: {type: DataTypes.STRING, allowNull: false, defaultValue: ''},
    html: {type: DataTypes.TEXT('long'), allowNull: true, defaultValue: ''},
    text: {type: DataTypes.TEXT('long'), allowNull: true, defaultValue: ''},
    textAsHtml: {type: DataTypes.TEXT('long'), allowNull: true, defaultValue: ''},
    date: {type: DataTypes.DATE, allowNull: false},
});

const mail_ignores =  mysql.define ('mail_ignores', {
    email_name: {type: DataTypes.STRING, allowNull: false, unique: true}, 
});

const authorizedControls = mysql.define ('authorizedControls', {
    ip: {type: DataTypes.STRING, allowNull: false},
    token: {type: DataTypes.STRING, allowNull: false},
});

const savedControlCommands = mysql.define ('savedControlCommands', {
    name: {type: DataTypes.STRING, allowNull: false},
    text: {type: DataTypes.STRING, allowNull: false},
    args: {type: DataTypes.STRING, defaultValue: ''},
});

const twitchchat_ignores = mysql.define ('twitchchat_ignores', {
    channelname: {type: DataTypes.STRING, allowNull: false}
});


function updateAll(Model, condition, values ){
    return Model.update(values, {where : condition, logging: ''})
}

function upsert(Model, values, condition) {
    return Model
        .findOne({ where: condition, logging: '' })
        .then(function(obj) {
            try{
                // update
                if(obj)
                    return obj.update(values, {logging: ''});
                // insert
                return Model.create(values, {logging: ''});
            } catch (e){
                if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                    throw new Error('Нет доступа к базе');
                } else {
                    throw new Error(`ошибка базы: ${e}`);
                }
            }
        })
}

const mysql_actions = [
    { names: ['daily', 'user'], 
        model: User}, 
    { names: ['voiceroles_clear', 'voiceroles', 'role'], 
        model: Role},
    { names: 'reactionrole', 
        model: ReactionRole}, 
    { names: 'remind', 
        model: Remind}, 
    { names: ['channels_clear','botchannel'], model: BotChannel},
    { names: ['streamersTwitch', 'twitchdata'], model: TwitchData},
    { names: ['streamersTrovo', 'trovodata'], model: TrovoData},
    { names: 'twitchclips', model: TwitchClips},
    { names: 'trovoclips', model: TrovoClips},
    { names: 'steamuser', model: SteamUserData},
    { names: 'vkuser', model: VKUserData},
    { names: 'vkfriend', model: VKUserFriendData},
    { names: 'twitchchat', model: TwitchChatData},
    { names: 'osuprofile', model: OsuProfileData},
    { names: 'osuscore', model: OsuScoreData},
    { names: 'token', model: Token},
    { names: 'osuactivity', model: OsuActivity},
    { names: 'youtubechannel', model: YoutubeChannelsData},
    { names: 'youtubevideos', model: YoutubeVideosData},
    { names: 'guildServicesTracking', model: guildServicesTracking},
    { names: 'replaycache', model: replayCache},
    { names: 'replayattachment', model: replayAttachment},
    { names: 'nibbers', model: nibbers},
    { names: 'guildSettings', model: guildSettings},
    { names: 'osuHunterTrackingUser', model: osuHunterTrackingUser},
    { names: 'cryptopairs', model: cryptopairs},
    { names: 'authorizedMailUsers', model: authorizedMailUsers},
    { names: 'mail_contents', model: mail_contents},
    { names: 'mail_ignores', model: mail_ignores},
    { names: 'authorizedControls', model: authorizedControls},
    { names: 'savedControlCommands', model: savedControlCommands},
    { names: 'twitchchat_ignores', model: twitchchat_ignores},
];

function select_mysql_model (action){

    const MysqlModel = mysql_actions.find ( model => {
        if (typeof model.names === 'string'){
            return model.names === action;
        } else if (typeof model.names === 'object') {
            return model.names.findIndex( val => val === action) > -1;
        } else {
            return undefined;
        }
    });

    if (!MysqlModel){
        console.error(`DB: (selectMysqlModel) undefined action: ${action}`);
        throw new Error('unknown mysql model', action);
    }

    return MysqlModel.model;
}

async function MYSQL_SAVE( action, keys, values){
    const MysqlModel = select_mysql_model(action);

    switch (action){
        case `user`:
            if (values.coins){
                if (values.coins >= coins_max){
                    values.coins = coins_max;                
                }
                if (values.coins <= 0){
                    values.coins = 0;
                }
            }
            break;
        case `role`:
            //или роль продается или установлена на канал
            if (!values.chanid) {
                values.chanid = '0'
            } else {
                values.price = -1
            }
            if (values.price){
                if (values.price < -1){
                    values.price = -1
                }
                if (values.price >= coins_max){
                    values.price = coins_max
                }
            }
            break;
        default:
            break;
    }
    if (keys !== 0){
        values = await module.exports.MYSQL_MERGE_KEYS_VALUES(keys, values)
    }
    try {
        if (typeof values.length !== 'undefined' && values.length>0){
            return await MysqlModel.bulkCreate(values, {logging: ''})
        } else {
            return upsert(MysqlModel, values , keys);
        }
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }       
}

async function MYSQL_GET_ONE(action, keys){
    const MysqlModel = select_mysql_model(action);
    try {
        return  await MysqlModel.findOne({ where: keys , logging: ''})
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }
}

async function MYSQL_GET_ALL(action, params = {}){
    const MysqlModel = select_mysql_model(action);
    var condition = {};
    switch (action){
        case `daily`:
            if (typeof params.guildid === 'undefined') throw new Error('unknown guildid');
            condition = {
                guildid: params.guildid,
                dailynotified: false
            }
        break;
        case `voiceroles`:
            condition = {
                chanid: { [Op.not]: '0' }
            }
        break;
        case `reactionrole`:
            if (typeof params.guildid === 'undefined') throw new Error('unknown guildid');
            if (typeof params.messageid === 'undefined') throw new Error('unknown messageid');
            condition = {
                guildid: params.guildid,
                messageid: params.messageid
            }
        break;
        case `remind`:
            if (typeof params.guildid === 'undefined') throw new Error('unknown guildid');
            if (params.userid){
                condition = {
                    guildid: params.guildid,
                    userid: params.userid
                }
            } else {
                condition = {
                    guildid: params.guildid
                }
            }
        break;
        case `twitchclips`:
        case `trovoclips`:
        case `vkfriend`:
            if (typeof params.userid === 'undefined') throw new Error('unknown userid');
            condition = {
                userid: params.userid
            }
        break;

        default:
            condition = params?params:{};
        break;
    }
    try{
        return await MysqlModel.findAll ({ where: condition, logging: '', order: 
            [['id', 'DESC']] });
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }    
}

async function MYSQL_UPDATE(action, values){
    const MysqlModel = select_mysql_model(action);
    var save_values = {};
    switch (action){
        case `voiceroles_clear`:
            save_values = { chanid: '0' };
            break;
        case `channels_clear`:
            save_values = { channelid: values.systemchannelid };
            break;
        default:
            console.error(`DB: (mysql update) undefined action: ${action}`);
            break;
    }

    try{
        return await updateAll(MysqlModel, {guildid: values.guildid}, save_values );
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }    
}

async function MYSQL_DELETE(action, condition){
    const MysqlModel = select_mysql_model(action);
    try{
        console.log('delete mysql:', action, condition)
        return await MysqlModel.destroy({
            where: condition, logging: ''
        });
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            console.error('can not delete', action, condition);
        }
    }   
}

function MYSQL_GET_ALL_RESULTS_TO_ARRAY(mysqldata){
    var res = [];
    if (mysqldata.length>0){
        for (let data of mysqldata){
            res.push(data.dataValues);
        }
    }
    return res;
}


function GET_VALUES_FROM_OBJECT_BY_KEY (arrayobject, valuekey){
    var res = [];
    for (let data of arrayobject){
        res.push(data[valuekey]);
    }
    return res;
}

async function getTrackingUsersForGuild(guildid, platformaction, mysql_tablename){
    let guildServicesTracking_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('guildServicesTracking', {
        guildid: guildid,
        platformaction: platformaction
    });

    if (guildServicesTracking_data.length>0){
        let guildServicesTracking_userdata = GET_VALUES_FROM_OBJECT_BY_KEY(guildServicesTracking_data, 'key');

        var searchUserID = table_id_names.filter( obj => obj.platforms.includes(platformaction.split("_")[0]));
        
        if (searchUserID.length === 0){
            throw Error('getTrackingUsersForGuild: undefined platfform ' + platformaction);
        } else {
            searchUserID = (searchUserID.shift()).name_id;
        }
        
        return await MYSQL_GET_TRACKING_DATA_BY_ACTION(mysql_tablename, { [searchUserID]: guildServicesTracking_userdata } );
    } else {
        return [];
    }
}

async function getTrackingInfo(message, mysql_tablename, trackingType, emoji, moduleName, fieldsMapping) {
    const mysql_data = await getTrackingUsersForGuild(message.guild.id, `${trackingType}_tracking`, mysql_tablename);
    

    if (mysql_data.length > 0) {
        let MessageFields = [];
        let fieldValuesById = {};

        for (let userdata of mysql_data) {
            for (let field of fieldsMapping) {
                let key = field.key;
                let value = userdata[key].toString();

                if (!fieldValuesById[key]) {
                    fieldValuesById[key] = [];
                }

                fieldValuesById[key].push(value);
            }
        }

        for (let field of fieldsMapping) {
            let key = field.key;
            let values = fieldValuesById[key].join('\n');
            MessageFields.push({ name: field.name, value: values, inline: true });
        }

        

        await SendAnswer({
            channel: message.channel,
            guildname: message.guild.name,
            messagetype: 'info',
            title: `${emoji} ${moduleName}`,
            text: 'Tracking users info',
            fields: MessageFields,
        });
    } else {
        await SendAnswer({
            channel: message.channel,
            guildname: message.guild.name,
            messagetype: 'info',
            title: `${emoji} ${moduleName}`,
            text: 'No tracking users',
        });
    }
}

async function MYSQL_GET_TRACKING_DATA_BY_ACTION(action, custom_query_params = {}){
    var query_params = {};
    var query_action = action;

    switch (action){
        case 'steamuser':
        case 'streamersTrovo':
        case 'streamersTwitch':
        case 'twitchchat':
        case 'osuprofile':
        case 'vkuser':
        case 'youtubechannel':
            query_params = {tracking: true};
            break;
        case 'vkuser_friends':
            query_action = 'vkuser';
            query_params = {tracking: true, friendsTracking: true};
            break;
        case 'guildSettings':
        case 'trovoclips':
        case 'twitchclips':
        case 'guildServicesTracking':
        case 'vkfriend':
        case 'botchannel':
            query_params = custom_query_params;
            break;
        default:
            throw new Error('undefined action');
    }
    return MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(query_action, query_params));
}


module.exports = {
    getTrackingInfo: getTrackingInfo,
    getTrackingUsersForGuild: getTrackingUsersForGuild,
    MYSQL_GET_TRACKING_DATA_BY_ACTION: MYSQL_GET_TRACKING_DATA_BY_ACTION,
    getGuildidsOfTrackingUserServiceByGuildId: async function (platformaction, guildid = 0){

        const query = guildid === 0? { platformaction: platformaction }: { platformaction: platformaction, guildid: guildid.toString() };
        
        var mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('guildServicesTracking', query));
        return GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'key');
    },

    getGuildidsOfTrackingUserService: async function (platformaction, key){
        var mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('guildServicesTracking', {
            platformaction: platformaction,
            key: key.toString()
        }));
        var guildids = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'guildid');
        return guildids.filter( (value, index, self) => self.indexOf(value) === index );
    },

    MYSQL_GET_ALL_RESULTS_TO_ARRAY: MYSQL_GET_ALL_RESULTS_TO_ARRAY,

    prepareDB: async function (){
        log('Подготовка баз данных', 'DB');
        try {
            const mysql_checkdb = require('mysql2/promise');
            const connection = await mysql_checkdb.createConnection(`mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`);
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error('Нет доступа к базе');
            } else {
                throw new Error(`ошибка базы: ${e}`);
            }
        }
        await mysql.sync({ logging: ''})
        LogString(`System`,`info`,`База данных`,`Подготовка завершена`)
    },

    MYSQL_MERGE_KEYS_VALUES: async function( keys, values ){
        return await Object.assign({},keys, values);
    },

    MYSQL_SAVE: MYSQL_SAVE, 

    MYSQL_GET_ONE: MYSQL_GET_ONE, 

    MYSQL_GET_ALL: MYSQL_GET_ALL, 

    MYSQL_UPDATE: MYSQL_UPDATE, 

    MYSQL_DELETE: MYSQL_DELETE, 

    manageGuildServiceTracking: async function (guildid, platform, action, value, trackingdata, mysql_tablename){
        trackingdata[1] = trackingdata[1].toString();
        if (value === true){
            await MYSQL_SAVE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                key: trackingdata[1]}, 
                {key: trackingdata[1]});
            await MYSQL_SAVE(mysql_tablename, {[trackingdata[0]]: trackingdata[1]}, {[action]: value});
            log('Добавлен новый канал в тренкинг лист '+trackingdata[1], moduleName);
        } else {
            await MYSQL_DELETE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                key: trackingdata[1]});
            log('Удален канал из тренкинг листа гильдии '+trackingdata[1], moduleName);

            //поиск по всем гильдиям
            let foundedchannel = await MYSQL_GET_ONE('guildServicesTracking', {
                platformaction: `${platform}_${action}`, 
                key: trackingdata[1]});
            if (foundedchannel === null){
                await MYSQL_SAVE(mysql_tablename, {[trackingdata[0]]: trackingdata[1]}, {[action]: value});
                log('Будет отключен общий трекинг. Канал не отслеживается не одной гильдией '+trackingdata[1], moduleName);
            };
        }
    },

    manageGuildCryptoTracking: async function (guildid, platform, action, pair, is_tracking ){
        const key = `${pair.first}-${pair.second}`;
        if (is_tracking === true){
            await MYSQL_SAVE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                key: key}, 
                {key: key});
            log('Добавлен новая криптопара в тренкинг лист '+key, moduleName);
        } else {
            await MYSQL_DELETE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                key: key});
            log('Удалена криптопара из тренкинг листа '+key, moduleName);
        }
    }

}