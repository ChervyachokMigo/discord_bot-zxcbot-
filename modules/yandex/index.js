const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { log } = require("../../tools/log.js");

const { listenWebFolder, listenWebFile } = require('../tools.js');
const HTTP_PORT = 80;

module.exports = {
    init: async () => {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.listen(HTTP_PORT, ()=>{
            log(`Webserver listening on http://localhost:${HTTP_PORT}!`, 'Dashboard');
        });

        app.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Address in use, retrying...');
            }
        });

        listenWebFolder( app, '/', 'yandex');

        listenWebFile(app, '/','yandex/index.html');

    },
}

