function isJSON(str) {
        try {
            JSON.parse(str.toString());
        } catch (e) {
            return false;
        }
        return true;
}

let connection = new WebSocket("ws://localhost:8888");

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

var users = {
    osu: [],
    steam: [],
    twitch: [],
    trovo: [],
    vk: [],
    youtube: []
}

var selected_user = {
    osu: 0,
    steam: 0,
    twitch: 0,
    trovo: 0,
    vk: 0,
    youtube: 0
}

const options_deps = [
    {platform: 'osu', select: '#osuprofiles_userids', is_id_number: true, username_key: 'username', user_key: 'userid', options: [
        {selector: '#osuprofiles_tracking', value_key: 'tracking', action: 'osuprofile_tracking_change'}
    ]},
    {platform: 'steam', select: '#steam_ids', is_id_number: false, username_key: 'username', user_key: 'steamid', options: [
        {selector: '#steam_tracking', value_key: 'tracking', action: 'steamuser_tracking_change'}
    ]},
    {platform: 'twitch', select: '#twitch_user_ids', is_id_number: true, username_key: 'username', user_key: 'userid', options: [
        {selector: '#twitch_user_tracking', value_key: 'tracking', action: 'twitch_user_tracking_change' },
        {selector: '#twitch_followers_tracking', value_key: 'followersTracking', action: 'twitch_followers_tracking_change'  },
        {selector: '#twitch_user_records', value_key: 'records', action: 'twitch_user_records_change'  },
        {selector: '#twitch_user_clips_tracking', value_key: 'clipsTracking', action: 'twitch_user_clips_tracking_change'  },
        {selector: '#twitch_user_clips_records', value_key: 'clipsRecords', action: 'twitch_user_clips_records_change'  },
    ]},
    {platform: 'trovo', select: '#trovo_user_ids', is_id_number: true, username_key: 'username', user_key: 'userid', options: [
        {selector: '#trovo_user_tracking', value_key: 'tracking', action: 'trovo_user_tracking_change'},
        {selector: '#trovo_followers_tracking', value_key: 'followersTracking', action: 'trovo_followers_tracking_change'},
        {selector: '#trovo_user_records', value_key: 'records', action: 'trovo_user_records_change'}
    ]},
    {platform: 'vk', select: '#vk_ids', is_id_number: true, username_key: ['name1', 'name2'], user_key: 'userid', options: [
        {selector: '#vk_users_tracking', value_key: 'tracking', action: 'vk_user_tracking_change'},
        {selector: '#vk_friends_tracking', value_key: 'friendsTracking', action: 'vk_friends_tracking_change'}
    ]},
    {platform: 'youtube', select: '#youtube_ids', is_id_number: true, username_key: 'channelname', user_key: 'id', options: [
        {selector: '#youtube_tracking', value_key: 'tracking', action: 'youtube_tracking_change'}
    ]},
];

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

function create_user_block(platform, data){
    let options = options_deps.filter( val => val.platform === platform).pop();
    clearSelect(options.select);
    users[platform] = data;
    for (let user of users[platform]){
        let username = user[options.username_key];
        if (platform.startsWith('vk')){
            username = [user[options.username_key[0]], user[options.username_key[1]]].join(' ');
        }
        createOption(options.select, username, user[options.user_key] );
    }
    for (let option of options.options){
        createBooleanOptions(option.selector);
    }
    selectLastSelectedOption( options.select, selected_user[platform] );
    if (selected_user[platform] == 0){
        $(options.select).trigger('change');
    }
    user_select(platform);
}

function send_selected_option (obj) {
    let selector = '#' + $(obj).prop('id');
    let selected_option_id = -1;
    let options = options_deps.filter( val => {
        for (let id in val.options){
            if (val.options[id].selector.startsWith(selector)) {
                selected_option_id = id;
                return true;
            }
        }
    }).pop();
    let value = ($(obj).find(':selected').val().toString()) === 'true';
    let action = options.options[selected_option_id].action;
    let data = { userid: selected_user[options.platform], value }
    connection.send( JSON.stringify({ action , data } ));
}

function user_select(platform){
    let options = options_deps.filter( val => val.platform === platform).pop();
    if (options.is_id_number == true){
        selected_user[platform] = Number($(options.select).find(":selected").val());
    } else {
        selected_user[platform] = $(options.select).find(":selected").val();
    }
    for (let option of options.options){
        $(option.selector + ' option:selected').removeAttr('selected');
    }
    for (let user of users[platform]){
        if (user[options.user_key] === selected_user[platform]){
            for (let option of options.options){
                $(option.selector + ' option[value='+ user[option.value_key] +']').prop('selected', true);
            }
        }
    }
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
            create_user_block('osu', db_data);
            break;
        case 'steamusers':
            create_user_block('steam', db_data);
            break;
        case 'trovousers':
            create_user_block('trovo', db_data);
            break;
        case 'twitchusers':
            create_user_block('twitch', db_data);
            break;
        case 'vkusers':
            create_user_block('vk', db_data);
            break;
        case 'youtube_users':
            create_user_block('youtube', db_data);
            break;
        default:
            console.log('no action');
            break;
    }
};