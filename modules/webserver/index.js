

const express = require('express');
const path = require('path');

const bodyParser = require('body-parser');
const { log } = require("../../tools/log.js");

const { mail_init, set_events } = require('./mailer.js');

const HTTP_PORT = 80;

const public_path = path.join(__dirname,'/../../data/webserver_public');

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
    
    app.use(express.static(public_path));

    app.listen(port, ()=>{
        log(`Webserver listening on http://localhost:${port}!`, 'Webserver');
    });

}