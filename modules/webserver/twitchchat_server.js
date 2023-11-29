const cors = require('cors');
const express = require('express');

const bodyParser = require('body-parser');
const { log } = require("../../tools/log.js");
const path = require('path');

var app = express();

this.messages = [];

module.exports = {
    init: () => {
        this.messages = [];

        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
    
        app.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Address in use, retrying...');
            }
        });
    
        app.use(express.static(path.join(__dirname,'/../../data/chat_server') ));

        app.post('/add_message',(req, res) => {
            const {channelname, username, text} = req.body;
            this.messages.unshift({channelname, username, text});
            res.send( true );
        });

        app.post('/', (req, res) => {
            res.send( render() );
        });
    
        app.listen(1111, ()=>{
            log(`Webserver listening on http://localhost:1111!`, 'Webserver');
        });

    }
}


const render = () => {
    return this.messages.map ( x => 
    `<div class="message">` +
        `[<a href="https://www.twitch.tv/${x.channelname}">${x.channelname}</a>] > `+
        `[<a href="https://www.twitch.tv/${x.username}">${x.username}</a>] > ` +
        `${x.text}` +
    `</div>`);
}