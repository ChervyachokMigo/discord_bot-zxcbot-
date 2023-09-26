
const bodyParser = require('body-parser');

const { set_router_subdomain } = require('../../tools.js');

const api_controller = require('./api_consts/api_controller.js');

const init = (app) => {

    api = set_router_subdomain(app, 'api');

    api.use(bodyParser.json());
    api.use(bodyParser.urlencoded({ extended: false }));

    api_controller.init();

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

        await api_controller.action({
            ...{ ip: req.headers['x-forwarded-for'] }, 
            ...req.query,
            send: (result) => res.send(JSON.stringify(result))
        });

    });
}

module.exports = init;