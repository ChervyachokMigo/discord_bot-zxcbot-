const { key_timeout, token_length } = require('../api_consts/api_settings.js');

const { MYSQL_GET_ALL_RESULTS_TO_ARRAY } = require("../../../DB.js");
const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_DELETE, MYSQL_GET_ALL } = require("../../../DB/base.js");

const { GET_VALUES_FROM_OBJECT_BY_KEY, onlyUnique } = require('../../../tools.js');
const { generate_auth_key, generate_token } = require('./api_store_general.js');
const { emit } = require('../../../mailer/mailer-events.js');

let auth_keys = [];

let authed_ips = [];

let emails_ignore_list = [];

const remove_key = (ip) => {
    console.log('удалены ключи для ' + ip);
    auth_keys = auth_keys.filter( val => !val.ip === ip);
}

module.exports = {

    get_auth_key: (ip) => {
        const ip_key_pair = generate_auth_key(ip);
        remove_key (ip);
        auth_keys.push(ip_key_pair);
        setTimeout( remove_key, key_timeout, ip);
        console.log('создана ключ пара для авторизации: ', ip_key_pair);
        return ip_key_pair;
    },

    remove_key: (ip) => {
        console.log('удалены ключи для ' + ip);
        auth_keys = auth_keys.filter( val => !val.ip === ip);
    },

    valid_key: (ip, key) => {
        return auth_keys.findIndex( val => val.ip === ip && val.key === key ) > -1;
    },

    authtorize: async (ip) => {
        const token = generate_token(token_length);
        console.log('авторизован ' + ip);
        await MYSQL_SAVE( 'authorizedMailUsers', {ip}, {token} )
        authed_ips.push({ip, token});
        emit('mailer_event', { title: `Авторизован в Mailer`, text: `IP: ${ip}` });
    },

    validate_token: async (ip) => {
        if (!ip) return false;
        const i = authed_ips.findIndex( val => val.ip.includes(ip));
        const is_authed = i > -1;
        let token = '';
        if (is_authed){
            token = authed_ips[i].token;
        } else {
            let mysql_ip_token = await MYSQL_GET_ONE ( 'authorizedMailUsers', {ip} );
            if (mysql_ip_token !== null){
                token = mysql_ip_token.dataValues.token;
                authed_ips.push({ip, token});
                return {is_authed: true, token};
            }
        }
        return {is_authed, token}
    },

    check_token: (ip, token) => {
        return authed_ips.findIndex( val => val.ip === ip &&  val.token === token ) > -1;
    },

    auth_out: async (ip) => {
        authed_ips = authed_ips.filter( val => !val.ip === ip);
        await MYSQL_DELETE( 'authorizedMailUsers', {ip});
        emit('mailer_event', { title: `Юзер вышел из Mailer`, text: `IP: ${ip}` });
    },

    save_mail_content: async (args) => {
        await MYSQL_SAVE( 'mail_contents', { unique_key: args.unique_key }, args);
    },

    load_mail_addressees: async (args) => {
        const result = onlyUnique(
            GET_VALUES_FROM_OBJECT_BY_KEY(
                MYSQL_GET_ALL_RESULTS_TO_ARRAY(
                    await MYSQL_GET_ALL( 'mail_contents', {})
                ), 
            'addressee')
        );
        return result;
    },

    load_mail_posts: async (args) => {
        const result = MYSQL_GET_ALL_RESULTS_TO_ARRAY(
            await MYSQL_GET_ALL( 'mail_contents', {addressee: args.addressee}));

        return result.map( (val) => { return { 
            unique_key: val.unique_key,
            addressee: val.addressee,
            from: val.from,
            subject: val.subject,
            date: val.date
        } });
    },

    load_mail_post_content: async (args) => {
        const result = await MYSQL_GET_ONE( 'mail_contents', {unique_key: args.unique_key});
        return result.dataValues || undefined
    },

    delete_post: async (args) => {
        const result = await MYSQL_DELETE( 'mail_contents', {unique_key: args.unique_key});
        return result>0
    },

    load_ignore_emails: async () => {
        emails_ignore_list = GET_VALUES_FROM_OBJECT_BY_KEY(
            MYSQL_GET_ALL_RESULTS_TO_ARRAY(
            await MYSQL_GET_ALL( 'mail_ignores', {})
        ), 'email_name');
        return emails_ignore_list;
    },

    add_ignore_email: async (email_name) => {
        await MYSQL_SAVE( 'mail_ignores', { email_name }, { email_name });
    },
}