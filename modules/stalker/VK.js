//var ids_from_db = [53405222];
//var club_id = 93941632;

//var userStatusNew = await getVKUsersData(ids_from_db);
/*userStatusNew.id
userStatusNew.online
userStatusNew.first_name
userStatusNew.last_name
userStatusNew.last_seen.time
userStatusNew.followers_count
userStatusNew.status
*/
//console.log(userWallNew.items[1]);

//var userFriendsNew = await getVKUserFriendsCount(userStatusNew[0].id);
/*userFriendsNew.count
userFriendsNew.items //list ids
*/

/*var clubWallNew = await getVKClubWall(club_id);
clubWallNew.count
clubWallNew.items[i].id
clubWallNew.items[i].owner_id
clubWallNew.items[i].date
clubWallNew.items[i].text
clubWallNew.groups[0].id
clubWallNew.groups[0].name
*/

//var userWallNew = await getVKUserWall(ids_from_db[0]);
/*userWallNew.count
userWallNew.items[i].id
userWallNew.items[i].owner_id
userWallNew.items[i].date
userWallNew.items[i].text
userWallNew.items[i].copy_history[0].id

userWallNew.groups[i].id
userWallNew.groups[i].name
userWallNew.groups[i].id
userWallNew.groups[i].name
*/

const { MYSQL_GET_TRACKING_DATA_BY_ACTION, manageGuildServiceTracking, getTrackingInfo, 
    getGuildidsOfTrackingUserService } = require("../DB.js");

const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_DELETE } = require("../DB/base.js");

const { LogString, log } = require("../../tools/log.js");
const { GET_VALUES_FROM_OBJECT_BY_KEY, getNumberWithSign } = require("../../modules/tools.js");

const { getVKUsersData, getVKUserFriendsCount, getVKUserWall, getVKClubWall } = require (`../../modules/stalker/requests.js`);
const { getTimeMSKToStringFormat, getDiscordRelativeTime, timeAgo } = require('../../tools/time.js');

const { emoji_vk } = require("../../constantes/emojis.js");

const moduleName = `Stalker VK`;

module.exports = {
    MYSQL_VK_USER_TRACKING_CHANGE: async function(message, userid, option){
        //проверка юзера и создаание нового юзера
        var userdata = await MYSQL_GET_ONE('vkuser', {userid: userid});
        if (userdata === null ) {
            userdata = await MYSQL_TRACK_NEW_VK_USER(userid);
        } else {
            userdata = userdata.dataValues;
        }

        option.value = Boolean(option.value);
        switch  (option.action){
            case 'tracking':
                await manageGuildServiceTracking(message.guild.id, 'vkprofile', 'tracking', option.value, ['userid', userdata.userid], 'vkuser');
                break;
            case 'friends_tracking':
                await manageGuildServiceTracking(message.guild.id, 'vkprofile', 'friendsTracking', option.value, ['userid', userdata.userid], 'vkuser');
                break;
            default:
                throw new Error('unexpected error: undefined action');
        }
        return {success: true, text: `VK user **${userdata.name1} ${userdata.name2}** set **${option.action}** is **${option.value}**`}

    },

    VK_TRACKING_INFO: async function (message){
        const fieldsMapping = [
            { name: 'User ID', key: 'userid' },
            { name: 'First Name', key: 'name1' },
            { name: 'Last Name', key: 'name2' },
            { name: 'Friends Tracking', key: 'friendsTracking' },
        ];
        await getTrackingInfo(message, 'vkuser', 'vkprofile', emoji_vk, moduleName, fieldsMapping);
    },

    checkVKstatus: async function (stalkerEvents){
        try{

            var AllTrackingUsersVKData = await MYSQL_GET_TRACKING_DATA_BY_ACTION('vkuser');

            if (AllTrackingUsersVKData.length > 0){
                log('Проверка ВК профилей', moduleName);

                var TrackingUsers_ids = GET_VALUES_FROM_OBJECT_BY_KEY(AllTrackingUsersVKData, 'userid');
                var VKUsersDataNew = await getVKUsersData(TrackingUsers_ids);

                if (VKUsersDataNew.error_code){
                    console.error('VK Users check error\n','Error code:', VKUsersDataNew.error_code, '\n','Message', VKUsersDataNew.error_msg);
                    return false;
                }

                for (let VKUserData of AllTrackingUsersVKData){
        
                    let VKUserDataNew = getVKUserDataFromVKUsersRequestData(VKUsersDataNew, VKUserData.userid)
                    
                    let VKUserChanges = {
                        isChanges: false,
                        username: `${VKUserData.name1} ${VKUserData.name2}`,
                        userid: VKUserData.userid,
                        text: `Профиль **[${VKUserData.name1} ${VKUserData.name2}](https://vk.com/id${VKUserDataNew.userid})** имеет изменения:\n`,
                    }
        
                    if (VKUserData.name1 !== VKUserDataNew.name1){
                        VKUserChanges.text += `Имя: ${VKUserDataNew.name1}\n`;
                        VKUserChanges.isChanges = true;
                    }
        
                    if (VKUserData.name2 !== VKUserDataNew.name2){
                        VKUserChanges.text += `Фамилия: ${VKUserDataNew.name2}\n`;
                        VKUserChanges.isChanges = true;
                    }
        
                    if (VKUserData.statustext !== VKUserDataNew.statustext){
                        VKUserChanges.text += `Статус: ${VKUserDataNew.statustext}\n`;
                        VKUserChanges.isChanges = true;
                    }
        
                    if (VKUserData.followers !== VKUserDataNew.followers){
                        VKUserChanges.text += `Подписчики: ${VKUserDataNew.followers} ${getNumberWithSign(VKUserDataNew.followers-VKUserData.followers)}\n`;
                        VKUserChanges.isChanges = true;
                    }
                    
                    if (VKUserData.online !== VKUserDataNew.online){
                        if (VKUserDataNew.online === true){
                            VKUserChanges.text += `Вошел вконтакте!\n`
                            if (VKUserData.lastactive !== VKUserDataNew.lastactive){
                                var sleeptime = VKUserDataNew.lastactive-VKUserData.lastactive;
                                VKUserChanges.text += `Был оффлайн: **${timeAgo(sleeptime)}** назад\n${getDiscordRelativeTime(VKUserData.lastactive*1000)}\n`;
                                //VKUserChanges.isChanges = true;
                            }
                        } else {
                            VKUserChanges.text += `Вышел из сети\n`
                            if (VKUserData.lastactive !== VKUserDataNew.lastactive){
                                VKUserChanges.text += `Последний раз замечен: **${getTimeMSKToStringFormat(new Date(VKUserDataNew.lastactive*1000))}** ${getDiscordRelativeTime(VKUserDataNew.lastactive*1000)}\n`;
                                //VKUserChanges.isChanges = true;
                            }
                        }
                        
                        VKUserChanges.isChanges = true;
                    }
            
                    if (VKUserChanges.isChanges){
                        var SAVE_DATA = {
                            userid: VKUserDataNew.userid,
                            name1: VKUserDataNew.name1,
                            name2: VKUserDataNew.name2,
                            online: VKUserDataNew.online,
                            followers: VKUserDataNew.followers,
                            lastactive: VKUserDataNew.lastactive,
                            statustext: VKUserDataNew.statustext
                        };
                        VKUserChanges.guildids = await getGuildidsOfTrackingUserService('vkprofile_tracking',VKUserDataNew.userid);
                        await MYSQL_SAVE('vkuser', {userid: SAVE_DATA.userid}, SAVE_DATA);
                        stalkerEvents.emit('VKProfileChanges', VKUserChanges);
                    }
                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },

    
    checkVKfriends: async function (stalkerEvents){
        try{

            var AllTrackingUsersVKData = await MYSQL_GET_TRACKING_DATA_BY_ACTION('vkuser_friends');
            
            if (AllTrackingUsersVKData.length > 0){

                log('Проверка ВК друзей', moduleName);
                for (let VKUserData of AllTrackingUsersVKData){
                    let userfullname = `${VKUserData.name1} ${VKUserData.name2}`;
                    let userFriendsNew = await getVKUserFriendsCount(VKUserData.userid);

                    let mysql_data = await MYSQL_GET_TRACKING_DATA_BY_ACTION('vkfriend', {userid: VKUserData.userid});
                    let mysql_data_array = GET_VALUES_FROM_OBJECT_BY_KEY(mysql_data, 'friendid');
                    
                    let diff_rem = mysql_data_array.filter( (val) => !userFriendsNew.items.includes(val));
                    let diff_new = userFriendsNew.items.filter( (val) => !mysql_data_array.includes(val));
                    
                    if (diff_new.length>0 || diff_rem.length>0){
                        let users_diff_list = diff_new.concat(diff_rem);
                        var VKDiffUsersData = await getVKUsersData(users_diff_list);

                        await REWRITE_VK_FRIENDS(VKUserData, userFriendsNew);
                    }

                    if ((diff_new.length > 0 ) || (diff_rem.length > 0 )){
                        var trackingGuilds = await getGuildidsOfTrackingUserService('vkprofile_friendsTracking',VKUserData.userid);
                    }

                    if (diff_new.length > 0 ){

                        for (let userid of diff_new){
                            let userdata = getVKUserDataFromVKUsersRequestData(VKDiffUsersData, userid)
                            let friendname = `${userdata.name1} ${userdata.name2}`;
                            let Changes = {
                                userid: VKUserData.userid,
                                username: userfullname,
                                friendid: userid,
                                text: ``,
                                guildids: trackingGuilds,
                            }
                            Changes.text += `**${userfullname}** и [${friendname}](https://vk.com/id${userid}) стали друзьями\n`;
                            stalkerEvents.emit('VKFriendsChanges', Changes);
                        }
                    }

                    if (diff_rem.length > 0 ){

                        for (let userid of diff_rem){
                            let userdata = getVKUserDataFromVKUsersRequestData(VKDiffUsersData, userid)
                            let friendname = `${userdata.name1} ${userdata.name2}`;
                            let Changes = {
                                userid: VKUserData.userid,
                                username: userfullname,
                                friendid: userid,
                                text: ``,
                                guildids: trackingGuilds,
                            }
                            Changes.text += `**${userfullname}** и [${friendname}](https://vk.com/id${userid}) перестали быть друзьями\n`;
                            stalkerEvents.emit('VKFriendsChanges', Changes);
                        }
                    }

                }
            }
        } catch (e){
            LogString(`System`, `Error`, moduleName, e);
        }
    },

}

async function MYSQL_TRACK_NEW_VK_USER (userid){

    var VKUserNewRecordData = CONVERT_TO_VKUSER_OBJECT((await getVKUsersData([userid]))[0]);
    
    var VKFriendsNewRecordData = await getVKUserFriendsCount(userid);
    await MYSQL_SAVE('vkuser', {userid: userid}, VKUserNewRecordData);
    await REWRITE_VK_FRIENDS(VKUserNewRecordData, VKFriendsNewRecordData);

    return VKUserNewRecordData;
}

function CONVERT_TO_VKUSER_OBJECT(VK_values){
    var lastactive = 0;
    if (typeof VK_values.last_seen === 'undefined' || typeof VK_values.last_seen.time === 'undefined'){
        lastactive = 0
    } else {
        lastactive = Number(VK_values.last_seen.time);
    }
    var newobj = {
        tracking: true,
        userid: VK_values.id,
        name1: VK_values.first_name,
        name2: VK_values.last_name,
        online: Boolean(VK_values.online),
        lastactive: lastactive,
        followers: typeof VK_values.followers_count!=='undefined'?Number(VK_values.followers_count):0,
        statustext: typeof VK_values.status!=='undefined'?VK_values.status:'',
        friends: 0,
        friendsTracking: false,
    };
    return newobj
}

function getVKUserDataFromVKUsersRequestData(requestdata, userid){
    try{
        var userdata = (requestdata.filter( (val)=> {return userid === val.id}))[0];
        return CONVERT_TO_VKUSER_OBJECT(userdata)
    } catch(e) {
        console.error(e)
    }
}

async function REWRITE_VK_FRIENDS(userdata, friendsData){
    userdata.friends = friendsData.count;
    await MYSQL_DELETE('vkfriend', {userid: userdata.userid});
    let saveValues = [];
    for (let friendid of friendsData.items){
        saveValues.push ({userid: userdata.userid, friendid: friendid});
    }
    await MYSQL_SAVE('vkfriend', 0, saveValues);
    await MYSQL_SAVE('vkuser', {userid: userdata.userid}, {friends: userdata.friends});
}