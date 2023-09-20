

const express = require('express');

const bodyParser = require('body-parser');
const { log } = require("../../tools/log.js");

const { listenWebFolder, listenWebFile } = require('../tools.js');
const { mail_init, set_events } = require('./mailer.js');

const HTTP_PORT = 80;

var app = express();

module.exports = {
    init: (mailerEvents) => {
        set_events(mailerEvents);
        app = server_listen(HTTP_PORT);
    },
}

const server_listen = (port)=>{

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error('Address in use, retrying...');
        }
    });

    app.post('/message', (req, res) => {
        console.log(req.body);
        res.send('complete');
    });

    mail_init(app);
    
    listenWebFolder('/', 'data/webserver_public', app);
    listenWebFile('/', 'data/webserver_public/index.html', app);

    app.listen(port, ()=>{
        log(`Webserver listening on http://localhost:${port}!`, 'Webserver');
    });

}