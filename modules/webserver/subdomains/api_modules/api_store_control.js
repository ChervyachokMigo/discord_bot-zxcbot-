const { key_timeout, token_length } = require('../api_consts/api_settings.js');
const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_DELETE, MYSQL_GET_ALL, MYSQL_GET_ALL_RESULTS_TO_ARRAY } = require("../../../DB.js");
const { generate_auth_key, generate_token } = require('./api_store_general.js');

let control_auth_keys = [];

let control_authed_ips = [];

module.exports = {

    get_auth_key: (ip) => {
        const ip_key_pair = generate_auth_key(ip);
        module.exports.remove_control_key (ip);
        control_auth_keys.push(ip_key_pair);
        setTimeout( module.exports.remove_control_key, key_timeout, ip);
        console.log('создана ключ пара для авторизации: ', ip_key_pair);
        return ip_key_pair;
    },

    remove_key: (ip) => {
        console.log('удалены ключи для ' + ip);
        control_auth_keys = control_auth_keys.filter( val => !val.ip === ip);
    },

    valid_key: (ip, key) => {
        return control_auth_keys.findIndex( val => val.ip === ip && val.key === key ) > -1;
    },

    authtorize: async (ip) => {
        const token = generate_token(token_length);
        console.log('авторизован ' + ip);
        await MYSQL_SAVE( 'authorizedControls', {ip}, {token} )
        control_authed_ips.push({ip, token});
    },

    validate_token: async (ip) => {
        if (!ip) return false;
        const i = control_authed_ips.findIndex( val => val.ip.includes(ip));
        const is_authed = i > -1;
        let token = '';
        if (is_authed){
            token = control_authed_ips[i].token;
        } else {
            let mysql_ip_token = await MYSQL_GET_ONE ( 'authorizedControls', {ip} );
            if (mysql_ip_token !== null){
                token = mysql_ip_token.dataValues.token;
                control_authed_ips.push({ip, token});
                return {is_authed: true, token};
            }
        }
        return {is_authed, token}
    },

    check_token: (ip, token) => {
        return control_authed_ips.findIndex( val => val.ip === ip &&  val.token === token ) > -1;
    },

    auth_out: async (ip) => {
        control_authed_ips = control_authed_ips.filter( val => !val.ip === ip);
        await MYSQL_DELETE( 'authorizedControls', {ip});
    },

    add_command: async ({name, text, args}) => {
        console.log({name, text, args})
        await MYSQL_SAVE( 'savedControlCommands', {name}, {text, args} );
    },

    load_commands: async () => {
        return MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL( 'savedControlCommands'));
    },

}