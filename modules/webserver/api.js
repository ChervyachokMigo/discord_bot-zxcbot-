
const bodyParser = require('body-parser');
const fs = require('fs');

const { set_router_subdomain } = require('../tools.js');

const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_GET_TRACKING_DATA_BY_ACTION, 
    manageGuildServiceTracking, getTrackingInfo, getGuildidsOfTrackingUserService } = require("../DB.js");

var authed_ips = [];

const key_timeout = 150000;

var auth_keys = [];

var mailerEvents;

async function authtorize (ip, token) {
    console.log('авторизован ' + ip);
    await MYSQL_SAVE( 'authorizedMailUsers', {ip}, {token} )
    authed_ips.push({ip, token});
}

function remove_key (ip) {
    console.log('удалены ключи для ' + ip);
    auth_keys = auth_keys.filter( val => !val.ip.includes(ip));
}

async function check_auth(ip) {
    if (!ip) return false;
    const i = authed_ips.findIndex( val => val.ip.includes(ip) || false );
    const is_authed =  i > -1;
    let token = '';
    if (is_authed){
        token = authed_ips[i].token;
    } else {
        let mysql_ip_token = await MYSQL_GET_ONE ( 'authorizedMailUsers', {ip} );
        if (mysql_ip_token !== null){
            console.log('юзер авторизован, токена в базе')
            token = mysql_ip_token.dataValues.token;
            authed_ips.push({ip, token});
            console.log(token);
            return {is_authed: true, token};
        } else {
            console.log('юзер не авторизован, нет токена в базе')
        }
    }
    return {is_authed, token}
}

function generate_auth_key (ip){
    const digits = 6 + Math.floor(Math.random() * 2.499);
    const key = Math.random().toString().slice(2, 2 + digits);
    const ip_key_pair = {ip, key, key_timeout};
    remove_key (ip);
    mailerEvents.emit('auth_key', ip_key_pair);
    auth_keys.push(ip_key_pair);
    setTimeout( remove_key, key_timeout, ip);
    console.log('создана ключ пара для авторизации: ', ip_key_pair);
}

const token_literals = '0123456789abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generate_token (length = 32){
    let token = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * token_literals.length);
        token += token_literals.charAt(randomIndex);
    }
    return token;
}

const init = (app, events) => {
    mailerEvents = events;

    api = set_router_subdomain(app, 'api');

    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({ extended: false }));

    api.get('/query', async (req, res) => {
        if (!req.query){
            console.error('no query params');
            res.send(JSON.stringify({error: 'no query params'}))
            return;
        }
        const request = req.query;
        const ip = req.headers['x-forwarded-for'];
        if (!ip) {
            res.send(JSON.stringify({error: 'no ip'}));
            return;
        }
        switch (request.action){
            case 'is_authed': {
                res.send(JSON.stringify( await check_auth(ip) ));
                } break;
            case 'get_new_key':
                generate_auth_key(ip);
                res.send(JSON.stringify({ generate: true }));
                break;
            case 'auth_request': {
                if (!request.auth_key){
                    res.send(JSON.stringify({error: 'no auth_key'}));
                } else {
                    let is_valid = auth_keys.findIndex( val => val.ip.includes(ip) && val.key.includes(request.auth_key) ) > -1;
                    if (is_valid){ 
                        let token = generate_token();
                        await authtorize(ip, token);
                    } 
                    res.send(JSON.stringify(await check_auth(ip)));
                }
                remove_key (ip);
            } break;
            case 'inbox':
                res.send(JSON.stringify({ inbox: fs.readdirSync('data/mail_db') }));
                break;
            case 'posts': {
                if (!request.addressee) {
                    res.send(JSON.stringify({error: 'no addressee'}));
                    return;
                }
                let filepath = `data/mail_db/${request.addressee}`;
                res.send(JSON.stringify({ posts: fs.readdirSync(filepath) }));
            } break;
            case 'posts_content': {
                if (!request.addressee) {
                    res.send(JSON.stringify({error: 'no addressee'}));
                    return;
                }
                if (!request.post) {
                    res.send(JSON.stringify({error: 'no post'}));
                    return;
                }
                let filepath = `data/mail_db/${request.addressee}/${request.post}`;
                res.send(JSON.stringify({ content: fs.readFileSync(filepath, {encoding: 'utf-8'}) }));
            } break;
            //unused
            case 'ip':
                res.send(JSON.stringify({ ip: req.headers['x-forwarded-for'] }));
                break;
            default:
                console.error('no action');
                res.send(JSON.stringify({error: 'no action'}));
        }
    });
}

module.exports = init;