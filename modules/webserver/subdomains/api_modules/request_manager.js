const fs = require('fs');
const path = require('path');

const { api_requests_path } = require('../api_consts/api_settings.js');

let api_requests = []; 

module.exports = {
    init: () => {
        if (!fs.existsSync(api_requests_path)){
            throw new Error('can not find api request folder');
        }

        for (const api_request of fs.readdirSync(api_requests_path)) {
            api_requests.push({
                name: path.basename(api_request, '.js'),
                request: require(path.join(`../api_requests/${api_request}`)
            )});
        }
    },

    action: async (args) => {
        const i = api_requests.findIndex( req => args.action === req.name);
        if (!args.action || i == -1) {
            console.error('no action');
            this.result = {error: 'no action'};
        } else {

            if (api_requests[i].request.action.constructor.name === 'AsyncFunction'){
                this.result =  await api_requests[i].request.action(args);
            } else if (api_requests[i].request.action.constructor.name === 'Function'){
                this.result =  api_requests[i].request.action(args);
            } else {
                throw new Error('unknown function');
            }
        }
        args.send(this.result);
    }
}