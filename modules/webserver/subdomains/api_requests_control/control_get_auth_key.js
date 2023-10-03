
const { get_auth_key }  = require('../api_modules/api_store_control.js');
const { emit } = require('../../../mailer/mailer-events.js');

module.exports = {
    action: (args) => {
        emit('auth_control_key', get_auth_key(args.ip));
        return { generate: true };
    }
}

