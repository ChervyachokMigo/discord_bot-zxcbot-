
const bodyParser = require('body-parser');

const { set_router_subdomain } = require('../../tools.js');

const request_manager = require('./api_modules/request_manager.js');

const init = (app) => {

    const api = set_router_subdomain(app, 'api');

    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({ extended: false }));

    request_manager.init();

    api.get('/query', async (req, res) => {

        if (!req.query){
            console.error('no query params');
            res.send(JSON.stringify({error: 'no query params'}))
            return;
        }

        if (!req.headers['x-forwarded-for']) {
            res.send(JSON.stringify({error: 'no ip'}));
            return;
        }

        await request_manager.action({
            ...{ ip: req.headers['x-forwarded-for'] }, 
            ...req.query,
            send: (result) => res.send(JSON.stringify(result))
        });

    });
}

module.exports = init;