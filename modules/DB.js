const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require("../config.js");
const { coins_max } = require("../settings.js");

const { LogString, log } = require("../tools/log.js");

const { Sequelize, DataTypes, Op } = require('@sequelize/core');

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

async function MYSQL_SAVE( action, keys, values){
    var MysqlModel;
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
            MysqlModel = User;
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
            MysqlModel = Role;
            break;
        case `reactionrole`:
            MysqlModel = ReactionRole;
            break;
        case `remind`:
            MysqlModel = Remind;
            break;
        case `botchannel`:
            MysqlModel = BotChannel;
            break;
        case `twitchdata`:
            MysqlModel = TwitchData;
            break;
        case `trovodata`:
            MysqlModel = TrovoData;
            break;
        case `twitchclips`:
            MysqlModel = TwitchClips;
        break
        case `trovoclips`:
            MysqlModel = TrovoClips;
        break
        case `steamuser`:
            MysqlModel = SteamUserData;
        break 
        case `vkuser`:
            MysqlModel = VKUserData;
        break 
        case `vkfriend`:
            MysqlModel = VKUserFriendData;
        break 
        case `twitchchat`:
            MysqlModel = TwitchChatData;
        break 
        case `osuprofile`:
            MysqlModel = OsuProfileData;
        break
        case `osuscore`:
            MysqlModel = OsuScoreData;
        break
        case `token`:
            MysqlModel = Token;
        break
        case 'osuactivity':
            MysqlModel = OsuActivity
        break
        case 'youtubechannel':
            MysqlModel = YoutubeChannelsData
        break
        case 'youtubevideos':
            MysqlModel = YoutubeVideosData
        break
        case 'guildServicesTracking':
            MysqlModel = guildServicesTracking
        break
        case 'replaycache':
            MysqlModel = replayCache
        break
        case 'replayattachment':
            MysqlModel = replayAttachment
        break
        case 'nibbers':
            MysqlModel = nibbers
        break
        case 'guildSettings':
            MysqlModel = guildSettings
        break
        case 'osuHunterTrackingUser':
            MysqlModel = osuHunterTrackingUser
        break

        default:
            console.error (`DB: (mysql save) undefined action: ${action}`);
            return false;
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
    var MysqlModel;
    switch (action){
        case `user`:
            MysqlModel = User;
        break
        case `role`:
            MysqlModel = Role;
        break
        case `reactionrole`:
            MysqlModel = ReactionRole;
        break
        case `botchannel`:
            MysqlModel = BotChannel;
        break
        case `twitchdata`:
            MysqlModel = TwitchData;
        break
        case `trovodata`:
            MysqlModel = TrovoData;
        break
        case `trovoclips`:
            MysqlModel = TrovoClips;
        break
        case `steamuser`:
            MysqlModel = SteamUserData;
        break 
        case `vkuser`:
            MysqlModel = VKUserData;
        break 
        case `twitchchat`:
            MysqlModel = TwitchChatData;
        break
        case `osuprofile`:
            MysqlModel = OsuProfileData;
        break
        case `osuscore`:
            MysqlModel = OsuScoreData;
        break
        case `token`:
            MysqlModel = Token;
        break
        case 'osuactivity':
            MysqlModel = OsuActivity
        break
        case 'youtubechannel':
            MysqlModel = YoutubeChannelsData
        break
        case 'youtubevideos':
            MysqlModel = YoutubeVideosData
        break
        case 'guildServicesTracking':
            MysqlModel = guildServicesTracking
        break
        case 'replaycache':
            MysqlModel = replayCache
        break
        case 'replayattachment':
            MysqlModel = replayAttachment
        break
        case 'nibbers':
            MysqlModel = nibbers
        break
        case 'guildSettings':
            MysqlModel = guildSettings
        break
        case 'osuHunterTrackingUser':
            MysqlModel = osuHunterTrackingUser
        break

        default:
            console.error(`DB: (mysql get one) undefined action: ${action}`);
            return false;
    }
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
    var MysqlModel;
    var condition = {};
    switch (action){
        case `daily`:
            if (typeof params.guildid === 'undefined') throw new Error('unknown guildid')
            MysqlModel = User
            condition = {
                guildid: params.guildid,
                dailynotified: false
            }
        break
        case `voiceroles`:
            MysqlModel = Role
            condition = {
                chanid: { [Op.not]: '0' }
            }
        break
        case `reactionrole`:
            if (typeof params.guildid === 'undefined') throw new Error('unknown guildid')
            if (typeof params.messageid === 'undefined') throw new Error('unknown messageid')
            MysqlModel = ReactionRole
            condition = {
                guildid: params.guildid,
                messageid: params.messageid
            }
        break
        case `remind`:
            if (typeof params.guildid === 'undefined') throw new Error('unknown guildid')
            MysqlModel = Remind
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
        break
        case `botchannel`:
            //if (typeof params.guildid === 'undefined') throw new Error('unknown guildid')
            MysqlModel = BotChannel
            condition = params?params:{};
            /*condition = {
                guildid: params.guildid
            }*/
        break
        case `streamersTwitch`:
            MysqlModel = TwitchData
            condition = params?params:{};
        break
        case `streamersTrovo`:
            MysqlModel = TrovoData
            condition = params?params:{};
        break
        case `twitchclips`:
            if (typeof params.userid === 'undefined') throw new Error('unknown userid')
            MysqlModel = TwitchClips
            condition = {
                userid: params.userid
            }
        break
        case `trovoclips`:
            if (typeof params.userid === 'undefined') throw new Error('unknown userid')
            MysqlModel = TrovoClips
            condition = {
                userid: params.userid
            }
        break
        case `steamuser`:
            MysqlModel = SteamUserData;
            condition = params?params:{};
        break 
        case `vkuser`:
            condition = params?params:{};
            MysqlModel = VKUserData;
        break 
        case `vkfriend`:
            condition = {
                userid: params.userid
            }
            MysqlModel = VKUserFriendData;
        break 
        case `twitchchat`:
            condition = params?params:{};
            MysqlModel = TwitchChatData;
        break 
        case `osuprofile`:
            condition = params?params:{};
            MysqlModel = OsuProfileData;
        break
        case 'youtubechannel':
            condition = params?params:{};
            MysqlModel = YoutubeChannelsData
        break
        case 'guildServicesTracking':
            condition = params?params:{};
            MysqlModel = guildServicesTracking
        break
        case 'guildSettings':
            condition = params?params:{};
            MysqlModel = guildSettings
        break

        default:
            console.log(`MYSQL_GET_ALL: nothing requested. undefined action: ${action}`);
            return false
    }
    try{
        let res = await MysqlModel.findAll ({
            where: condition, logging: ''
        });
        //console.log(res)
        return res
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }    
}

async function MYSQL_UPDATE(action, values){
    var MysqlModel;
    var save_values = {};
    switch (action){
        case `voiceroles_clear`:
            MysqlModel = Role;
            save_values = { chanid: '0' };
            break;
        case `channels_clear`:
            MysqlModel = BotChannel;
            save_values = { channelid: values.systemchannelid } ;
            break;
        default:
            console.error(`DB: (mysql update) undefined action: ${action}`)
            break;
    }

    try{
        return await updateAll(MysqlModel, {guildid: values.guildid}, save_values )
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }    
}

async function MYSQL_DELETE(action, condition){
    var MysqlModel;

    switch (action){
        case `role`:
            MysqlModel = Role;
            break;
        case `reactionrole`:
            MysqlModel = ReactionRole;
            break;
        case `remind`:
            MysqlModel = Remind;
            break;
        case `botchannel`:
            MysqlModel = BotChannel;
            break;
        case `vkfriend`:
            MysqlModel = VKUserFriendData;
        break;
        case 'guildServicesTracking':
            MysqlModel = guildServicesTracking
        break
        default:
            console.error(`DB: (mysql delete) undefined action: ${action}`);
            return false;
    }
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
    let guildServicesTracking_data = MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL('guildServicesTracking', {
        guildid: guildid,
        platformaction: platformaction
    }));
    console.log(guildServicesTracking_data)
    if (guildServicesTracking_data.length>0){
        let guildServicesTracking_userdata = GET_VALUES_FROM_OBJECT_BY_KEY(guildServicesTracking_data, 'trackinguserid');
        console.log(guildServicesTracking_userdata)
        var searchUserID = '';
        console.log(platformaction.split("_")[0])
        switch (platformaction.split("_")[0]){
            case 'youtube':
                searchUserID = 'channelid';
                break;
            case 'twitch':
            case 'vk':
            case 'vkprofile':
            case 'trovo':
            case 'osu':  
            case 'osuprofile':
                searchUserID = 'userid';
                break;
            case 'steam':
            case 'steamprofile':
                searchUserID = 'steamid';
                break;
            case 'twitchchat':
                searchUserID = 'username';
                break;
            default:
                console.log('getTrackingUsersForGuild: undefined platfform '+platformaction);
                return [];
        }
        return MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(mysql_tablename, { [searchUserID]: guildServicesTracking_userdata } ));
    } else {
        return [];
    }
}



module.exports = {
    getTrackingUsersForGuild: getTrackingUsersForGuild,
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