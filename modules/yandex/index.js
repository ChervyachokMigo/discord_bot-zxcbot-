const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { log } = require("../../tools/log.js");

const { listenWebFolder, listenWebFile } = require('../tools.js');
const HTTP_PORT = 80;

module.exports = {
    init: () => {
        server_listen(HTTP_PORT);
    },
}

const server_listen = (port)=>{
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.listen(port, ()=>{
        log(`Webserver listening on http://localhost:${port}!`, 'Dashboard');
    });

    app.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error('Address in use, retrying...');
        }
    });

    app.post('/message', (req, res) => {
        console.log(req.body);
        res.send('complete');
    });

    listenWebFolder( app, '/', 'yandex');

    listenWebFile(app, '/','yandex/index.html');
}