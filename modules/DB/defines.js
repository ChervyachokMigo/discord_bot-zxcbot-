const { createConnection } = require('mysql2/promise');
const { Sequelize, DataTypes } = require('@sequelize/core');
const { log } = require("../../tools/log.js");

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_NAME_BEATMAPS } = require("../../config.js");

const osu_beatmaps_mysql = new Sequelize( DB_NAME_BEATMAPS, DB_USER, DB_PASSWORD, { 
    dialect: `mysql`,
    define: {
        updatedAt: false,
        createdAt: false,
        deletedAt: false
    },
});

const beatmaps_md5 = osu_beatmaps_mysql.define ('beatmaps_md5', {
    hash: {type: DataTypes.STRING(32),  defaultvalue: '', allowNull: false, unique: true, index: true},
});

const osu_beatmap_pp = osu_beatmaps_mysql.define ('osu_beatmap_pp', {
    md5: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false, unique: 'action_key'},
    mods: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false, unique: 'action_key'},
    accuracy: {type: DataTypes.INTEGER,  defaultvalue: 100, allowNull: false, unique: 'action_key'},
    pp_total: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    pp_aim: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    pp_speed: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    pp_accuracy: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    stars: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    diff_aim: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    diff_speed: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    diff_sliders: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    speed_notes: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    AR: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    OD: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
});

const beatmap_id = osu_beatmaps_mysql.define ('beatmap_id', {
    md5: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false, unique: true, primaryKey: true},
    beatmap_id: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    beatmapset_id: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
    gamemode: {type: DataTypes.TINYINT.UNSIGNED,  defaultvalue: '', allowNull: false},
    ranked: {type: DataTypes.TINYINT,  defaultvalue: 0, allowNull: false},
}, {noPrimaryKey: false});

const beatmap_info = osu_beatmaps_mysql.define ('beatmap_info', {
    md5: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false, unique: true, primaryKey: true},
    artist: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    title: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    creator: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
    difficulty: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
}, {noPrimaryKey: false});

const beatmap_star = osu_beatmaps_mysql.define ('beatmap_star', {
    md5: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false, unique: true, primaryKey: true},
    local: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
    lazer: {type: DataTypes.FLOAT,  defaultvalue: 0, allowNull: false},
}, {noPrimaryKey: false});

beatmaps_md5.hasMany(osu_beatmap_pp, {foreignKey: 'md5',  foreignKeyConstraints: false});
beatmap_id.hasMany(osu_beatmap_pp, {foreignKey: 'md5',  foreignKeyConstraints: false});
beatmap_info.hasMany(osu_beatmap_pp, {foreignKey: 'md5',  foreignKeyConstraints: false});

beatmaps_md5.hasOne(beatmap_id, {foreignKey: 'md5',  foreignKeyConstraints: false});
beatmaps_md5.hasOne(beatmap_info, {foreignKey: 'md5',  foreignKeyConstraints: false});
beatmaps_md5.hasOne(beatmap_star, {foreignKey: 'md5',  foreignKeyConstraints: false});

const mysql = new Sequelize( DB_NAME, DB_USER, DB_PASSWORD, { 
    dialect: `mysql`,
    define: {
        updatedAt: false,
        createdAt: false,
        deletedAt: false
    },
});

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

const twitchchat_enabled = mysql.define ('twitchchat_enabled', {
    channelname: {type: DataTypes.STRING, allowNull: false}
});

const twitchchat_sended_notify = mysql.define ('twitchchat_sended_notify', {
    channelname: {type: DataTypes.STRING, allowNull: false}
});

const twitch_osu_binds = mysql.define ('twitch_osu_binds', {
    twitch_id: {type: DataTypes.STRING, allowNull: false},
    twitch_name: {type: DataTypes.STRING, allowNull: false},
    osu_id: {type: DataTypes.INTEGER, allowNull: false},
    osu_name: {type: DataTypes.STRING, allowNull: false}
});

const twitch_banned = mysql.define ('twitch_banned', {
    channelname: {type: DataTypes.STRING, allowNull: false}
});


const mysql_actions = [
    { names: ['daily', 'user'], 
        model: User}, 
    { names: ['voiceroles_clear', 'voiceroles', 'role'], 
        model: Role},
    { names: 'reactionrole', 
        model: ReactionRole}, 
    { names: 'remind', 
        model: Remind}, 
    { names: ['channels_clear','botchannel'], model: BotChannel },
    { names: ['streamersTwitch', 'twitchdata'], model: TwitchData },
    { names: ['streamersTrovo', 'trovodata'], model: TrovoData },
    { names: 'twitchclips', model: TwitchClips },
    { names: 'trovoclips', model: TrovoClips },
    { names: 'steamuser', model: SteamUserData },
    { names: 'vkuser', model: VKUserData },
    { names: 'vkfriend', model: VKUserFriendData },
    { names: 'twitchchat', model: TwitchChatData },
    { names: 'osuprofile', model: OsuProfileData },
    { names: 'osuscore', model: OsuScoreData },
    { names: 'token', model: Token },
    { names: 'osuactivity', model: OsuActivity },
    { names: 'youtubechannel', model: YoutubeChannelsData },
    { names: 'youtubevideos', model: YoutubeVideosData },
    { names: 'guildServicesTracking', model: guildServicesTracking },
    { names: 'replaycache', model: replayCache },
    { names: 'replayattachment', model: replayAttachment },
    { names: 'nibbers', model: nibbers },
    { names: 'guildSettings', model: guildSettings },
    { names: 'osuHunterTrackingUser', model: osuHunterTrackingUser },
    { names: 'cryptopairs', model: cryptopairs },
    { names: 'authorizedMailUsers', model: authorizedMailUsers },
    { names: 'mail_contents', model: mail_contents },
    { names: 'mail_ignores', model: mail_ignores },
    { names: 'authorizedControls', model: authorizedControls },
    { names: 'savedControlCommands', model: savedControlCommands },
    { names: 'twitchchat_ignores', model: twitchchat_ignores },
    { names: 'twitchchat_enabled', model: twitchchat_enabled },
    { names: 'twitchchat_sended_notify', model: twitchchat_sended_notify },
    { names: 'twitch_osu_binds', model: twitch_osu_binds },
    { names: 'twitch_banned', model: twitch_banned },
    { names: 'beatmaps_md5', model: beatmaps_md5 },
    { names: 'osu_beatmap_pp', model: osu_beatmap_pp },
    { names: 'beatmap_id', model: beatmap_id },
    { names: 'beatmap_info', model: beatmap_info },
    { names: 'beatmap_star', model: beatmap_star }
];



module.exports = {
    prepareDB: async () => {
        log('Подготовка баз данных', 'База данных');
        try {
            const connection = await createConnection(`mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`);
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME_BEATMAPS}\`;`);
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error('Нет доступа к базе');
            } else {
                throw new Error(`ошибка базы: ${e}`);
            }
        }
        await osu_beatmaps_mysql.sync({ logging: false })
        await mysql.sync({ logging: false })
        
        log(`Подготовка завершена`, 'База данных')
    },

    select_mysql_model: (action) => {

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
    },
}