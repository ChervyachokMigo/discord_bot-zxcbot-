
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');

const { LOGSERVER_HTTP_PORT } = require('../../config.js');
const  fs  = require('fs');

const log_path = 'logs/logs.txt';

var logData = [];

module.exports = {
    initLogServer : function (){
        const public_path = path.join(__dirname, '/../../data/logserver_public');
        app.use(express.static(public_path));
        app.use(bodyParser.urlencoded({ extended: true }));

        app.get('/', (req, res) => {
            console.log(__dirname)
            res.sendFile( path.join(public_path, '/index.html') );
        });

        app.post('/', (req, res) => {
            if (typeof req.body !=='undefined'){
                var data = req.body;
                if (typeof data.action !=='undefined'){
                    switch (data.action){
                        case 'log':
                            //res.send(renderLog());
                            break;
                        default:
                            break;
                    }
                }
            }
                
        });

        app.listen(LOGSERVER_HTTP_PORT, () => {
            console.log(`Log server listening on port ${LOGSERVER_HTTP_PORT}`)
        })

    },

    saveLog: function(text){
        fs.appendFileSync(log_path, text + '\r\n', {encoding: 'utf8'});
        //logData.unshift(`<div class="logstring">${text}</div>`);
    }
}

function renderLog(){
    var htmldata = '';
    htmldata += logData.join('\n')

    return htmldata
}