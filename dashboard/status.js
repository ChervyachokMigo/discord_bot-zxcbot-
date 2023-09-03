function isJSON(str) {
        try {
            JSON.parse(str.toString());
        } catch (e) {
            return false;
        }
        return true;
}

let connection = new WebSocket("ws://localhost:8888");



var botchannels_guilds = [];
var botchannels_guildid_selected = 0;

function botchannels_select (){
    botchannels_guildid_selected = $('#botchannels_guildids').find(":selected").val();
    for (let botchannels of botchannels_guilds){
        if (botchannels[0].guildid === botchannels_guildid_selected){
        clearSelect('#botchannels_channels');
        for (let botchannel of botchannels){
            createOption('#botchannels_channels', botchannel.channeltype, botchannel.id );
        }
        };
    }
}

var is_only_tracking = {
    osu_profiles: false,
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

var osuprofiles = [];
var osuprofiles_selected = 0;

function osuprofiles_select() {
    osuprofiles_selected = Number($('#osuprofiles_userids').find(":selected").val());
    $('#osuprofiles_tracking option:selected').removeAttr('selected');
    for (let user of osuprofiles){
        if (user.userid === osuprofiles_selected){
        $('#osuprofiles_tracking option[value='+ user.tracking +']').prop('selected', true);
        }
    }
}

var steamusers = [];
var steamusers_selected = 0;

function steamuser_select() {
    steamusers_selected = $('#steam_ids').find(":selected").val();
    $('#steam_tracking option:selected').removeAttr('selected');
    for (let user of steamusers){
        if (user.steamid === steamusers_selected){
            $('#steam_tracking option[value='+ user.tracking +']').prop('selected', true);
        }
    }
}

var trovo_user_selected = 0;
var trovo_users = [];

function trovo_user_select() {
    trovo_user_selected = Number($('#trovo_user_ids').find(":selected").val());
    $('#trovo_user_tracking option:selected').removeAttr('selected');
    $('#trovo_followers_tracking option:selected').removeAttr('selected');
    $('#trovo_user_records option:selected').removeAttr('selected');
    for (let user of trovo_users){
        if (user.userid === trovo_user_selected){
            $('#trovo_user_tracking option[value='+ user.tracking +']').prop('selected', true);
            $('#trovo_followers_tracking option[value='+ user.followersTracking +']').prop('selected', true);
            $('#trovo_user_records option[value='+ user.records +']').prop('selected', true);
        }
    }
}

var twitch_user_selected = 0
var twitch_users = [];

function twitch_user_select(){
    twitch_user_selected = Number($('#twitch_user_ids').find(":selected").val());
    $('#twitch_user_tracking option:selected').removeAttr('selected');
    $('#twitch_followers_tracking option:selected').removeAttr('selected');
    $('#twitch_user_records option:selected').removeAttr('selected');
    $('#twitch_user_clips_tracking option:selected').removeAttr('selected');
    $('#twitch_user_clips_records option:selected').removeAttr('selected');
    for (let user of twitch_users){
        if (user.userid === twitch_user_selected){
            $('#twitch_user_tracking option[value='+ user.tracking +']').prop('selected', true);
            $('#twitch_followers_tracking option[value='+ user.followersTracking +']').prop('selected', true);
            $('#twitch_user_records option[value='+ user.records +']').prop('selected', true);
            $('#twitch_user_clips_tracking option[value='+ user.clipsTracking +']').prop('selected', true);
            $('#twitch_user_clips_records option[value='+ user.clipsRecords +']').prop('selected', true);
        }
    }
}

var vk_users_selected = 0;
var vk_users = [];

function vkusers_select(){
    vk_users_selected = Number($('#vk_ids').find(":selected").val());
    $('#vk_users_tracking option:selected').removeAttr('selected');
    $('#vk_friends_tracking option:selected').removeAttr('selected');
    for (let user of vk_users){
        if (user.userid === vk_users_selected){
            $('#vk_users_tracking option[value='+ user.tracking +']').prop('selected', true);
            $('#vk_friends_tracking option[value='+ user.friendsTracking +']').prop('selected', true);
        }
    }
}

var youtube_selected = 0;
var youtube_users = [];

function youtube_select(){
    youtube_selected = Number($('#youtube_ids').find(":selected").val());
    $('#youtube_tracking option:selected').removeAttr('selected');
    for (let user of youtube_users){
        if (user.id === youtube_selected){
            $('#youtube_tracking option[value='+ user.tracking +']').prop('selected', true);
        }
    }
}


function send_selected_option (obj, action, userid ) {
    let value = $(obj).find(':selected').val().toString() === 'true';
    connection.send( JSON.stringify({ action, data: {userid, value }} ));
}

function toggle_only_tracking(action, value){
    is_only_tracking[value] = !is_only_tracking[value];
    connection.send(JSON.stringify({action, data: {value: is_only_tracking[value]}}));
}

function createOption(select, text, value){
    if ($(select).find("option[value='" + value + "']").length) {
        $(select).val(value);
    } else { 
        var newOption = new Option(text, value, true, true);
        $(select).append(newOption);
    } 
}

function createBooleanOptions(selector){
    createOption(selector, 'false', false );
    createOption(selector, 'true', true );
}

function deleteOption(action, data) {
    connection.send(JSON.stringify({ action, data }));
}

function clearSelect(selector) {
    $(selector).empty();
    $(selector).prop("selectedIndex", -1);
}

function selectLastSelectedOption (selector, option_value) {
    if (option_value > 0) {
        $(selector + ' option[value='+ option_value +']' ).prop('selected', true);
    } else {
        option_value = $(selector + ' option:first' ).val();
        $(selector + ' option:first').prop('selected', true);
    }
}

$(document).ready(function(){
    $('#botchannel_delete').click(function(e){
        let deleted_channel_id = $('#botchannels_channels').find(":selected").val().toString();
        deleteOption('botchannel_delete', {id: deleted_channel_id});
        $("#botchannels_channels option[value='"+deleted_channel_id+"']").remove();
    });
});

connection.onopen = () => {
    connection.onclose = (ev=>{
        console.error('connection close');
        console.log(ev);
    });
    
    connection.onerror = (err=>{
        console.error('connection error');
        console.log(err);
    });

    connection.send(JSON.stringify({action: "connect"}));
};

connection.onmessage = (data) => {

    if (!isJSON(data.data)) {
        console.error('is not json');
        return false;
    }

    var data_json = JSON.parse(data.data);
    var db_data = data_json.data;

    if (!data_json.action){
        console.error('undefined action');
        return false;
    }

    switch (data_json.action){
        case 'guildids':
            console.log('servers', data_json.data);
            break;
        case 'botchannels':
            clearSelect('#botchannels_guildids');
            botchannels_guilds = db_data;
            for (let botchannels of botchannels_guilds){
                createOption('#botchannels_guildids', botchannels[0].guildid, botchannels[0].guildid );
            }
            selectLastSelectedOption( '#botchannels_guildids', botchannels_guildid_selected );
            if ($('#botchannels_channels').find("option").length == 0) {
                $('#botchannels_guildids').trigger('change');
            }
            break;
        case 'osuprofiles':
            clearSelect('#osuprofiles_userids');
            osuprofiles = db_data;
            for (let user of osuprofiles){
                createOption('#osuprofiles_userids', user.username, user.userid );
            }
            createBooleanOptions('#osuprofiles_tracking');
            selectLastSelectedOption( '#osuprofiles_userids', osuprofiles_selected );
            if (osuprofiles_selected == 0){
                $('#osuprofiles_userids').trigger('change');
            }
            osuprofiles_select();
            break;
        case 'steamusers':
            clearSelect('#steam_ids');
            steamusers = db_data;
            for (let user of steamusers){
                createOption('#steam_ids', user.username, user.steamid );
            }
            createBooleanOptions('#steam_tracking');
            selectLastSelectedOption( '#steam_ids', steamusers_selected );
            if (steamusers_selected == 0){
                $('#steam_ids').trigger('change');
            }
            steamuser_select();
            break;
        case 'trovousers':
            clearSelect('#trovo_user_ids');
            trovo_users = db_data;
            for (let user of trovo_users){
                createOption('#trovo_user_ids', user.username, user.userid );
            }
            createBooleanOptions('#trovo_user_tracking');
            createBooleanOptions('#trovo_followers_tracking');
            createBooleanOptions('#trovo_user_records');
            selectLastSelectedOption( '#trovo_user_ids', trovo_user_selected );
            if (trovo_user_selected == 0){
                $('#trovo_user_ids').trigger('change');
            }
            trovo_user_select();
            break;
        case 'twitchusers':
            clearSelect('#twitch_user_ids');
            twitch_users = db_data;
            for (let user of twitch_users){
                createOption('#twitch_user_ids', user.username, user.userid );
            }
            createBooleanOptions('#twitch_user_tracking');
            createBooleanOptions('#twitch_followers_tracking');
            createBooleanOptions('#twitch_user_records');
            createBooleanOptions('#twitch_user_clips_tracking');
            createBooleanOptions('#twitch_user_clips_records');
            selectLastSelectedOption( '#twitch_user_ids', twitch_user_selected );
            if (twitch_user_selected == 0){
                $('#twitch_user_ids').trigger('change');
            }
            twitch_user_select();
            break;
        case 'vkusers':
            clearSelect('#vk_ids');
            vk_users = db_data;
            for (let user of vk_users){
                createOption('#vk_ids', `${user.name1} ${user.name2}`, user.userid );
            }
            createBooleanOptions('#vk_users_tracking');
            createBooleanOptions('#vk_friends_tracking');
            selectLastSelectedOption( '#vk_ids', vk_users_selected );
            if (vk_users_selected == 0){
                $('#vk_ids').trigger('change');
            }
            vkusers_select();
            break;
        case 'youtube_users':
            clearSelect('#youtube_ids');
            youtube_users = db_data;
            for (let user of youtube_users){
                createOption('#youtube_ids', user.channelname, user.id );
            }
            createBooleanOptions('#youtube_tracking');
            selectLastSelectedOption( '#youtube_ids', youtube_selected );
            if (youtube_selected == 0){
                $('#youtube_ids').trigger('change');
            }
            youtube_select();
            break;
        default:
            console.log('no action');
            break;
    }

};
