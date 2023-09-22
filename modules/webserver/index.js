const cors = require('cors');
const express = require('express');
const path = require('path');

const bodyParser = require('body-parser');
const { log } = require("../../tools/log.js");

const { mail_init, preinit_set_events } = require('./mailer.js');

const api_init = require('./api.js');

const test_init = require('./test.js');

const { WEBSERVER_HTTP_PORT } = require('../../config.js');

const public_path = path.join(__dirname,'/../../data/webserver_public');

var app = express();

module.exports = {
    init: (mailerEvents) => {
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        preinit_set_events(mailerEvents);
        mail_init(app);

        api_init(app, mailerEvents);

        test_init(app);

        app.use(express.static(public_path));
    
        app.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Address in use, retrying...');
            }
        });
    
        app.post('/message', (req, res) => {
            console.log(req.body);
            res.send('complete');
        });
    
        app.listen(WEBSERVER_HTTP_PORT, ()=>{
            log(`Webserver listening on http://localhost:${WEBSERVER_HTTP_PORT}!`, 'Webserver');
        });
    },
}
