const { DataTypes } = require('@sequelize/core');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_NAME_TWITCHCHAT } = require("../../config.js");
const { prepareDB, prepareEND, add_model_names } = require('mysql-tools');

module.exports = {
    prepareDB: async () => {
        const connections = await prepareDB({ DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DATABASES: [DB_NAME, DB_NAME_TWITCHCHAT] });

		const mysql_connection = connections[0];
		const twitch_chat_connection = connections[1];

		const User = mysql_connection.define ('user', {
			guildid: { type: DataTypes.STRING, unique: `guilduser`, allowNull: false },
			userid: { type:DataTypes.STRING, unique: `guilduser`, allowNull: false },
			restricted: {type: DataTypes.BOOLEAN, defaultValue: false },
			coins: { type: DataTypes.INTEGER, defaultValue: 0 },
			lastdaily: { type: DataTypes.DATE, defaultValue: 0 },//DataTypes.NOW - daily_waittime_ms - 1000
			dailynotified: { type: DataTypes.BOOLEAN, defaultValue: true },
		});

		const Role = mysql_connection.define ('role', {
			guildid: { type: DataTypes.STRING, unique: `guildrole`, allowNull: false },
			roleid: { type: DataTypes.STRING, unique: `guildrole`, allowNull: false },
			price: { type: DataTypes.INTEGER, defaultValue: -1 },
			chanid: { type:DataTypes.STRING, defaultValue: '0' },
		});

		const ReactionRole = mysql_connection.define ('reactionrole', {
			guildid: { type: DataTypes.STRING, unique: `message`, allowNull: false },
			messageid: { type:DataTypes.STRING, unique: `message`, allowNull: false },
			emoji: { type:DataTypes.STRING, unique: `message`, allowNull: false },
			emojitype: { type:DataTypes.STRING, allowNull: false },
			roleid: { type:DataTypes.STRING, allowNull: false },
		});

		const Remind = mysql_connection.define ('remind', {
			guildid: { type: DataTypes.STRING, unique: `remind`, allowNull: false },
			userid: { type:DataTypes.STRING, unique: `remind`, allowNull: false },
			text: { type:DataTypes.STRING,  unique: `remind`, allowNull: false },
			time: { type:DataTypes.DATE,  allowNull: false },
			timeMin: { type:DataTypes.INTEGER,  defaultValue: 1 },
			infinity: { type:DataTypes.BOOLEAN,  defaultValue: false },
		});

		const BotChannel = mysql_connection.define ('botchannel', {
			guildid: { type: DataTypes.STRING, unique: `message`, allowNull: false },
			channeltype: { type: DataTypes.STRING, unique: `message`, allowNull: false },
			channelid: { type:DataTypes.STRING,   allowNull: false }
		});

		const TwitchData = mysql_connection.define ('twitchdata', {
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

		const TwitchClips = mysql_connection.define ('twitchclips', {
			userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			clipid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
		});

		const TrovoClips = mysql_connection.define ('trovoclips', {
			userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			clipid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
		});

		const SteamUserData = mysql_connection.define ('steamuser', {
			tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
			steamid: {type: DataTypes.STRING,  defaultvalue: 0, allowNull: false},
			onlinestate: {type: DataTypes.INTEGER,  defaultvalue: '', allowNull: false},
			username: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			lastactive: {type: DataTypes.INTEGER},
			gameid: {type: DataTypes.INTEGER,  defaultvalue: 0},
			gameinfo: {type: DataTypes.STRING,  defaultvalue: ''},
			url: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
		});

		const TrovoData = mysql_connection.define ('trovodata', {
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

		const VKUserData = mysql_connection.define ('vkuser', {
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

		const VKUserFriendData = mysql_connection.define ('vkfriend', {
			userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			friendid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
		});

		/*
		const VKUserPostData = mysql_connection.define ('vkpost', {
			postid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			text: {type: DataTypes.TEXT,  defaultvalue: '', allowNull: false},
			date: {type: DataTypes.DATE,  defaultvalue: '', allowNull: false},

		});*/

		const TwitchChatData = twitch_chat_connection.define ('twitchchat', {
			username: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
		});

		const OsuProfileData = mysql_connection.define ('osuprofile', {
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

		const OsuActivity = mysql_connection.define ('osuactivity', {
			activityid: {type: DataTypes.BIGINT,  defaultvalue: 0, allowNull: false},
			date: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			type: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
		});

		const OsuScoreData = mysql_connection.define ('osuscore', {
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

		const YoutubeChannelsData = mysql_connection.define ('youtubeChannelsData', {
			channelid: {type: DataTypes.STRING,  defaultvalue: ``, unique: true, allowNull: false},
			channelname: {type: DataTypes.STRING, defaultvalue: ``, allowNull: false},
			icons_default:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
			icons_medium:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
			icons_high: {type: DataTypes.STRING, defaultValue: ``, allowNull: false},
			creation_date: {type: DataTypes.INTEGER, defaultValue: 0, allowNull: false},
			updoads_playlistid:{type: DataTypes.STRING, defaultValue: ``, allowNull: false},
			tracking: {type: DataTypes.BOOLEAN,  defaultvalue: true, allowNull: false},
		});

		const YoutubeVideosData = mysql_connection.define ('youtubeVideosData', {
			videoid: {type: DataTypes.STRING, defaultValue: '0', unique: true, allowNull: false},
			videotitle: {type: DataTypes.STRING, defaultValue: '', allowNull: false},
			preview_default:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
			preview_medium:  {type:DataTypes.STRING, defaultValue: ``, allowNull: false},
			preview_high: {type: DataTypes.STRING, defaultValue: ``, allowNull: false},
			date:  {type:DataTypes.INTEGER, defaultValue: 0, allowNull: false},
		});

		const Token = mysql_connection.define ('token', {
			value: {type: DataTypes.TEXT,  defaultvalue: '', allowNull: false},
			platform: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			getdate: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			expires: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			type: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
		});

		const guildServicesTracking = mysql_connection.define ('guildServicesTracking', {
			guildid: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			platformaction: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			key: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
		});

		const replayCache = mysql_connection.define ('osureplaycache', {
			replay_md5: {type: DataTypes.STRING,  unique: true, defaultvalue: '', allowNull: false},
			replayJSONdata: {type: DataTypes.JSON,  defaultvalue: '', allowNull: false},
		});

		const replayAttachment = mysql_connection.define ('osureplayattachment', {
			imageid: {type: DataTypes.BIGINT,  unique: true, defaultvalue: 0, allowNull: false},
			userid: {type: DataTypes.BIGINT,  defaultvalue: 0, allowNull: false},
			beatmap_md5: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			replay_md5: {type: DataTypes.STRING,  defaultvalue: '', allowNull: false},
			time: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			zoom: {type: DataTypes.INTEGER,  defaultvalue: 400, allowNull: false},
		});

		const nibbers = mysql_connection.define ('nibbers', {
			userid: {type: DataTypes.BIGINT, unique: true, defaultvalue: 0, allowNull: false},
			nibbers: {type: DataTypes.BIGINT, defaultvalue: 0, allowNull: false},
		});

		const guildSettings = mysql_connection.define ('guildSettings', {
			guildid: {type: DataTypes.BIGINT, defaultvalue: 0, allowNull: false},
			settingname: {type: DataTypes.STRING, defaultvalue: '', allowNull: false},
			value: {type: DataTypes.STRING, defaultvalue: '', allowNull: false},
		});

		const osuHunterTrackingUser = mysql_connection.define ('osuHunterTrackingUser', {
			userid: {type: DataTypes.INTEGER,  defaultvalue: 0, allowNull: false},
			lastUpdated: {type: DataTypes.DATEONLY,  defaultvalue: false, allowNull: false},    
		});

		const cryptopairs = mysql_connection.define ('cryptopairs', {
			first: {type: DataTypes.STRING, allowNull: false},
			second: {type: DataTypes.STRING, allowNull: false},
			value: {type: DataTypes.DOUBLE, defaultValue: 0.0},
			value_change: {type: DataTypes.DOUBLE, defaultValue: 0.0},
			is_online: {type: DataTypes.BOOLEAN, defaultValue: false},
			last_update: {type: DataTypes.DATE, allowNull: false}
		});

		add_model_names({ names: ['daily', 'user'], model: User}); 
		add_model_names({ names: ['voiceroles_clear', 'voiceroles', 'role'], model: Role});
		add_model_names({ names: 'reactionrole', model: ReactionRole}); 
		add_model_names({ names: 'remind', model: Remind}); 
		add_model_names({ names: ['channels_clear','botchannel'], model: BotChannel });
		add_model_names({ names: ['streamersTwitch', 'twitchdata'], model: TwitchData });
		add_model_names({ names: ['streamersTrovo', 'trovodata'], model: TrovoData });
		add_model_names({ names: 'twitchclips', model: TwitchClips });
		add_model_names({ names: 'trovoclips', model: TrovoClips });
		add_model_names({ names: 'steamuser', model: SteamUserData });
		add_model_names({ names: 'vkuser', model: VKUserData });
		add_model_names({ names: 'vkfriend', model: VKUserFriendData });
		add_model_names({ names: 'twitchchat', model: TwitchChatData });
		add_model_names({ names: 'osuprofile', model: OsuProfileData });
		add_model_names({ names: 'osuscore', model: OsuScoreData });
		add_model_names({ names: 'token', model: Token });
		add_model_names({ names: 'osuactivity', model: OsuActivity });
		add_model_names({ names: 'youtubechannel', model: YoutubeChannelsData });
		add_model_names({ names: 'youtubevideos', model: YoutubeVideosData });
		add_model_names({ names: 'guildServicesTracking', model: guildServicesTracking });
		add_model_names({ names: 'replaycache', model: replayCache });
		add_model_names({ names: 'replayattachment', model: replayAttachment });
		add_model_names({ names: 'nibbers', model: nibbers });
		add_model_names({ names: 'guildSettings', model: guildSettings });
		add_model_names({ names: 'osuHunterTrackingUser', model: osuHunterTrackingUser });
		add_model_names({ names: 'cryptopairs', model: cryptopairs });
        
        await prepareEND();
    },

}