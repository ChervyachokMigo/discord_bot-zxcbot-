const express = require('express');
const app = express();
const { HTTP_PORT } = require('../../config.js');
const path = require('path');
const bodyParser = require('body-parser')
require('../../settings.js');
const fs = require('fs');

module.exports = {
    init: async () => {
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.listen(HTTP_PORT, ()=>{
            console.log(`Webserver listening on http://localhost:${HTTP_PORT}!`);
        });

        app.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
              console.error('Address in use, retrying...');
            }
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname,'../../dashboard/index.html'));
        });

        app.get('/settings', (req, res) => {
            res.sendFile(path.join(__dirname,'../../dashboard/index_settings.html'));
        });

        app.get('/jquery.min.js', (req, res) => {
            res.sendFile(path.join(__dirname,'../../dashboard/jquery.min.js'));
        });

        app.get('/styles.css', (req, res) => {
            res.sendFile(path.join(__dirname,'../../dashboard/styles.css'));
        });

        app.get('/favicon.ico', (req, res) => {
            res.sendFile(path.join(__dirname,'../../dashboard/favicon.png'));
        });

        app.post('/save_settings', async (req, res) => {
            try{
                var settings = {};
                console.log('recev data', req.body)
                settings = req.body;
                console.log('post save_settings', settings);
                fs.writeFileSync('../settings.json', JSON.stringify(settings) );
                console.log('settings saved');
                res.send('settings saved');
            } catch (e){
                console.error(e);
            }
        });

        app.post('/load_all_settings', async (req, res) => {
            try{
                let settings = fs.readFileSync('../settings.json', 'utf-8');
                console.log('post init settings', JSON.parse(settings));
                res.send(JSON.parse(settings));
            } catch (err){
                console.error(err);
                throw new Error(err);
            }
        });

    }
}


