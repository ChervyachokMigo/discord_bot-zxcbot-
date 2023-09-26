const { key_timeout } = require('../api_consts/api_settings.js');
const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_DELETE } = require("../../../DB.js");

const token_literals = '0123456789abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';


let auth_keys = [];

let authed_ips = [];


module.exports = {
    auth_keys: auth_keys,

    generate_auth_key: (ip) => {
        const digits = 6 + Math.floor(Math.random() * 2.499);
        const key = Math.random().toString().slice(2, 2 + digits);
        const ip_key_pair = {ip, key, key_timeout};
        module.exports.remove_key (ip);
        auth_keys.push(ip_key_pair);
        setTimeout( module.exports.remove_key, key_timeout, ip);
        console.log('создана ключ пара для авторизации: ', ip_key_pair);
        return ip_key_pair;
    },

    remove_key: (ip) => {
        console.log('удалены ключи для ' + ip);
        auth_keys = auth_keys.filter( val => !val.ip.includes(ip));
    },

    valid_key: (ip, key) => {
        return auth_keys.findIndex( val => val.ip.includes(ip) && val.key.includes(key) ) > -1;
    },

    authtorize: async (ip) => {
        const token = generate_token();
        console.log('авторизован ' + ip);
        await MYSQL_SAVE( 'authorizedMailUsers', {ip}, {token} )
        authed_ips.push({ip, token});
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
        return authed_ips.findIndex( val => val.ip.includes(ip) &&  val.token.includes(token) ) > -1;
    },

    auth_out: async (ip) => {
        authed_ips = authed_ips.filter( val => !val.ip.includes(ip));
        await MYSQL_DELETE( 'authorizedMailUsers', {ip});
    }
}

function generate_token (length = 32){
    let token = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * token_literals.length);
        token += token_literals.charAt(randomIndex);
    }
    return token;
}