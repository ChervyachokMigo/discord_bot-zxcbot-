
const { generate_auth_key }  = require('../api_modules/api_store.js');
const { emit } = require('../../../mailer/mailer-events.js');

module.exports = {
    action: (args) => {
        emit('auth_key', generate_auth_key(args.ip));
        return { generate: true };
    }
}

