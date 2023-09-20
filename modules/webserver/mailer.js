const express = require('express');
const fs = require('fs');
const path = require('path');

const { set_router_subdomain } = require('../tools.js');

const public_path = path.join(__dirname,'/../../data/webserver_mail_public');

const key_timeout = 150000;

var mailerEvents;

var is_authed = [];
var keys = [];

function authtorize (ip) {
    console.log('авторизован ' + ip);
    is_authed.push(ip);
}

function remove_key (ip) {
    console.log('удалены ключи для ' + ip);
    keys = keys.filter( val => !val.ip.includes(ip));
}

function generate_key (ip){
    const digits = 6 + Math.floor(Math.random() * 2.499);
    const key = Math.random().toString().slice(2, 2 + digits);
    const ip_key_pair = {ip, key, key_timeout};
    remove_key (ip);
    keys.push(ip_key_pair);
    mailerEvents.emit('auth_key', ip_key_pair);
    setTimeout( remove_key, key_timeout, ip);
    console.log('создана ключ пара для авторизации: ' + ip_key_pair);
}

function check_auth(ip) {
    if (!ip) return false;
    return is_authed.findIndex( val => val.includes(ip) ) > -1;
}

module.exports = {
    set_events: (smtp_events) => {
        mailerEvents = smtp_events;
    },

    mail_init: (app) => {

        const mail_router = set_router_subdomain(app, 'mail');

        mail_router.use(express.static(public_path));
    
        const back_button = '<div><a href="./../">Back</a></div>';
    
        mail_router.get('/auth', (req, res) => {
            const ip = req.headers['x-forwarded-for'];
            if (check_auth(ip)) {
                res.redirect('/inbox');
                return;
            }
            
            generate_key(ip);
    
            res.send ('<h2>Auth</h2><form action="/auth/key" method="POST">'+
            '<label for="key">Enter key:</label><input type="text" name="key" required minlength="6" maxlength="8">'+
            '<button type="submit">check</button>'+
            '</form>');
            return;
        });
    
        mail_router.post('/auth/key', (req, res) => {
            const key = req.body.key || '';
            const ip = req.headers['x-forwarded-for'];
    
            if (!key || !ip) {
                res.redirect('/');
                return;
            }
    
            const is_valid = keys.findIndex( val => val.ip.includes(ip) && val.key.includes(key) ) > -1;
            if ( !is_valid ){
                res.redirect('/auth');
                return;
            }
    
            remove_key (ip);
            authtorize(ip);
            
            res.redirect('/inbox');
            return;
        });
    
        mail_router.get('/auth/out', (req, res) => {
            const ip = req.headers['x-forwarded-for'];
    
            if (!ip) {
                res.redirect('/');
                return;
            }
    
            is_authed = is_authed.filter( val => !val.includes(ip));
            
            res.redirect('/');
            return;
        });
    
        mail_router.get('/inbox', (req, res) => {
            check_and_send (req, res, () => {
                const inbox = fs.readdirSync('data/mail_db');
                const header = `<h2>Inbox</h2>`;
                const empty =  '<div>< Пусто ></div>';
                const out = `<div><a href="/auth/out">Quit</a></div>`;
    
                const inbox_list = inbox.length > 0? inbox.map( sendTo => `<div><a href="/inbox/${sendTo}">${sendTo}</a></div>`).join(''): empty;

                return header + back_button + inbox_list + out;
            });
        });
    
        mail_router.get('/inbox/:sendTo', (req, res) => {
            check_and_send (req, res, () => {
                const sendTo = req.params.sendTo;
                const header = `<h2>To: ${sendTo}</h2>`;
                const empty =  '<div>< Пусто ></div>';

                const posts = fs.readdirSync(`data/mail_db/${sendTo}`);
                const posts_list = posts.length > 0? posts.map( post => `<div><a href="/inbox/${sendTo}/${post}">${post}</a></div>`).join(''): empty;

                return header + back_button + posts_list;
            });
        });
    
        mail_router.get('/inbox/:sendTo/:post', (req, res) => {
            check_and_send (req, res, () => {
                const sendTo = req.params.sendTo;
                const post = path.basename(req.params.post);
                const extname = path.extname(post);
        
                var postdata = fs.readFileSync(`data/mail_db/${sendTo}/${post}`);
        
                if (extname.includes('txt') || !postdata.includes('<div')){
                    postdata = `<pre>${postdata}</pre>`;
                }
        
                return back_button + postdata;
            });
        });
        
    },
}

function check_and_send(req, res, callback){
    const ip = req.headers['x-forwarded-for'];
    
    if (!ip) {
        res.redirect('/');
        return;
    }

    if (!check_auth(ip)) {
        res.redirect('/auth');
        return;
    }

    res.send(callback( req, res ));
    return;
}