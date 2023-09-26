const { key_timeout, token_literals, auth_key_digits_base_length, auth_key_digits_extra_length, token_length } = require('../api_consts/api_settings.js');
const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_DELETE } = require("../../../DB.js");


let auth_keys = [];

let authed_ips = [];


module.exports = {
    auth_keys: auth_keys,

    generate_auth_key: (ip) => {
        const digits = auth_key_digits_base_length + Math.floor(Math.random() * auth_key_digits_extra_length);
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