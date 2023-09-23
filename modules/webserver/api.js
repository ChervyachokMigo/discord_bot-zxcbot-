
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const { set_router_subdomain } = require('../tools.js');

const { MYSQL_SAVE, MYSQL_GET_ONE, MYSQL_DELETE } = require("../DB.js");

var authed_ips = [];

const key_timeout = 150000;

var auth_keys = [];

var mailerEvents;

async function auth_out (ip){
    authed_ips = authed_ips.filter( val => !val.ip.includes(ip));
    await MYSQL_DELETE( 'authorizedMailUsers', {ip});
}

function check_token (ip, token){
    return authed_ips.findIndex( val => val.ip.includes(ip) &&  val.token.includes(token) ) > -1;
}

async function authtorize (ip, token) {
    console.log('авторизован ' + ip);
    await MYSQL_SAVE( 'authorizedMailUsers', {ip}, {token} )
    authed_ips.push({ip, token});
}

function remove_key (ip) {
    console.log('удалены ключи для ' + ip);
    auth_keys = auth_keys.filter( val => !val.ip.includes(ip));
}

async function check_auth_get_token(ip) {
    if (!ip) return false;
    const i = authed_ips.findIndex( val => val.ip.includes(ip));
    const is_authed =  i > -1;
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

function generate_token (length = 32){
    let token = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * token_literals.length);
        token += token_literals.charAt(randomIndex);
    }
    return token;
}

const token_literals = '0123456789abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const mailRegex = /(?:(?![a-zA-Z0-9_]{1}[a-zA-Z0-9_.-]*[a-zA-Z0-9_-]*).)/gi
const dateRegex = /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{4}\.\b(txt|html|empty)/gi

const mail_db_path = 'data/mail_db';

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
                res.send(JSON.stringify( await check_auth_get_token(ip) ));
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
                    res.send(JSON.stringify(await check_auth_get_token(ip)));
                }
                remove_key (ip);
            } break;
            case 'inbox': {
                if (request.token){
                    if (check_token(ip, request.token)){
                        if (fs.existsSync(mail_db_path)){
                            res.send(JSON.stringify({ inbox: fs.readdirSync(mail_db_path) }));
                            return;
                        } else {
                            await auth_out(ip);
                            res.send(JSON.stringify({error: 'invalid path'}));
                            return
                        } 
                    }
                }
                await auth_out(ip);
                res.send(JSON.stringify({error: 'invalid credentials'}));
                } break;
            case 'posts': {
                if (request.token){
                    if (check_token(ip, request.token)){
                        const escaped_addressee = decodeURI(request.addressee).replace(mailRegex, '');

                        if (!escaped_addressee) {
                            res.send(JSON.stringify({error: 'no addressee'}));
                            return;
                        }
                        let filepath = path.join( mail_db_path, escaped_addressee);
                        if (fs.existsSync(filepath)){
                            res.send(JSON.stringify({ posts: fs.readdirSync(filepath) }));
                            return;
                        } else {
                            await auth_out(ip);
                            res.send(JSON.stringify({error: 'invalid path'}));
                            return;
                        } 
                    }
                }
                await auth_out(ip);
                res.send(JSON.stringify({error: 'invalid credentials'}));
                } break;
            case 'posts_content': {
                if (request.token){
                    if (check_token(ip, request.token)){

                        const escaped_addressee = decodeURI(request.addressee).replace(mailRegex, '');
                        const matchedDate = decodeURI(request.post).match(dateRegex, '');
                        const escaped_post = matchedDate !== null ? matchedDate.shift() : '';

                        if (!escaped_addressee) {
                            res.send(JSON.stringify({error: 'no addressee'}));
                            return;
                        }
                        if (!escaped_post) {
                            res.send(JSON.stringify({error: 'no post'}));
                            return;
                        }

                        let filepath = path.join( mail_db_path, escaped_addressee, escaped_post);
                        
                        if (fs.existsSync(filepath)){
                            res.send(JSON.stringify({ content: fs.readFileSync(filepath, {encoding: 'utf-8'}) }));
                            return;
                        } else {
                            await auth_out(ip);
                            res.send(JSON.stringify({error: 'invalid path'}));
                            return;
                        } 
                    }
                }
                await auth_out(ip);
                res.send(JSON.stringify({error: 'invalid credentials'}));
            } break;
            case 'logout':
                await auth_out(ip);
                res.send(JSON.stringify({is_authed: false, token: ''}));
                break;
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