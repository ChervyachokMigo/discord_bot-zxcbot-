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
    activityid: {type: DataTypes.BIGINT,  defaultvalue: BigInt(0), allowNull: false},
    date: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    type: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
});

const OsuScoreData = mysql.define ('osuscore', {
    scoreid: {type: DataTypes.BIGINT,  defaultvalue: BigInt(0), allowNull: false},
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
    trackinguserid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
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

function select_mysql_model (action){
    let MysqlModel;

    switch (action) {
        case `daily`:
        case `user`:
            MysqlModel = User; break;
        case `voiceroles_clear`:
        case `voiceroles`:
        case 'role':
            MysqlModel = Role; break;
            case `reactionrole`:
                MysqlModel = ReactionRole; break;
            case `remind`:
                MysqlModel = Remind; break;
            case `channels_clear`:
            case `botchannel`:
                MysqlModel = BotChannel; break;
            case `streamersTwitch`:
            case `twitchdata`:
                MysqlModel = TwitchData; break;
            case `streamersTrovo`:
            case `trovodata`:
                MysqlModel = TrovoData; break;
            case `twitchclips`:
                MysqlModel = TwitchClips; break;
            case `trovoclips`:
                MysqlModel = TrovoClips; break;
            case `steamuser`:
                MysqlModel = SteamUserData; break;
            case `vkuser`:
                MysqlModel = VKUserData; break;
            case `vkfriend`:
                MysqlModel = VKUserFriendData; break;
            case `twitchchat`:
                MysqlModel = TwitchChatData; break;
            case `osuprofile`:
                MysqlModel = OsuProfileData; break;
            case `osuscore`:
                MysqlModel = OsuScoreData; break;
            case `token`:
                MysqlModel = Token; break;
            case 'osuactivity':
                MysqlModel = OsuActivity; break;
            case 'youtubechannel':
                MysqlModel = YoutubeChannelsData; break;
            case 'youtubevideos':
                MysqlModel = YoutubeVideosData; break;
            case 'guildServicesTracking':
                MysqlModel = guildServicesTracking; break;
            case 'replaycache':
                MysqlModel = replayCache; break;
            case 'replayattachment':
                MysqlModel = replayAttachment; break;
            case 'nibbers':
                MysqlModel = nibbers; break;
            case 'guildSettings':
                MysqlModel = guildSettings; break;
            case 'osuHunterTrackingUser':
                MysqlModel = osuHunterTrackingUser; break;
        default:
            console.error(`DB: (selectMysqlModel) undefined action: ${action}`);
            throw new Error('unknown mysql model', action);
    }

    return MysqlModel;
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
        case `botchannel`:
        case `streamersTwitch`:
        case `streamersTrovo`:
        case `steamuser`:
        case `vkuser`:
        case `twitchchat`:
        case `osuprofile`:
        case 'youtubechannel':
        case 'guildServicesTracking':
        case 'guildSettings':
            condition = params?params:{};
        break;
    }
    try{
        let res = await MysqlModel.findAll ({
            where: condition, logging: ''
        });
        //console.log(res)
        return res;
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
            throw new Error(e);
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
        let guildServicesTracking_userdata = GET_VALUES_FROM_OBJECT_BY_KEY(guildServicesTracking_data, 'trackinguserid');

        var searchUserID = table_id_names.filter( obj => obj.platforms.includes(platformaction.split("_")[0]));
        
        if (searchUserID.length == 0){
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
    console.log(`${trackingType}_TRACKING_INFO`, 'guild', message.guild.id, 'data', mysql_data);

    if (mysql_data.length > 0) {
        var MessageFields = [];
        var fieldValuesById = {};

        for (var userdata of mysql_data) {
            for (var field of fieldsMapping) {
                var key = field.key;
                var value = userdata[key].toString();

                if (!fieldValuesById[key]) {
                    fieldValuesById[key] = [];
                }

                fieldValuesById[key].push(value);
            }
        }

        for (var field of fieldsMapping) {
            var key = field.key;
            var values = fieldValuesById[key].join('\n');
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
            query_action = 'vk_user';
            query_params = {tracking: true, friendsTracking: true};
            break;
        case 'guildSettings':
        case 'trovoclips':
        case 'twitchclips':
        case 'guildServicesTracking':
        case 'vkfriend':
        case 'botchannel':
        default:
            query_params = custom_query_params;
    }
    return MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(query_action, query_params));
}


module.exports = {
    getTrackingInfo: getTrackingInfo,
    getTrackingUsersForGuild: getTrackingUsersForGuild,
    MYSQL_GET_TRACKING_DATA_BY_ACTION: MYSQL_GET_TRACKING_DATA_BY_ACTION,
    getGuildidsOfTrackingUserService: async function (platformaction, trackinguserid){
        var mysql_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('guildServicesTracking', {
            platformaction: platformaction,
            trackinguserid: trackinguserid.toString()
        }));

        var guildids = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'guildid');
        return guildids.filter((value, index, self)=>{
            return self.indexOf(value) === index;
        });
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
        if (value == true){
            await MYSQL_SAVE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                trackinguserid: trackingdata[1]}, 
                {trackinguserid: trackingdata[1]});
            await MYSQL_SAVE(mysql_tablename, {[trackingdata[0]]: trackingdata[1]}, {[action]: value});
            log('Добавлен новый канал в тренкинг лист '+trackingdata[1], moduleName);
        } else {
            await MYSQL_DELETE('guildServicesTracking', {
                guildid: guildid,
                platformaction: `${platform}_${action}`,
                trackinguserid: trackingdata[1]});
            log('Удален канал из тренкинг листа гильдии '+trackingdata[1], moduleName);

            //поиск по всем гильдиям
            let foundedchannel = await MYSQL_GET_ONE('guildServicesTracking', {
                platformaction: `${platform}_${action}`, 
                trackinguserid: trackingdata[1]});
            if (foundedchannel === null){
                await MYSQL_SAVE(mysql_tablename, {[trackingdata[0]]: trackingdata[1]}, {[action]: value});
                log('Будет отключен общий трекинг. Канал не отслеживается не одной гильдией '+trackingdata[1], moduleName);
            };
        }
    },

}