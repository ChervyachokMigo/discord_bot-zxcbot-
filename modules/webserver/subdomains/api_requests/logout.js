
const { auth_out }  = require('../api_consts/api_store.js');

module.exports = {
    action: async (args) => {
        await auth_out(args.ip);
        return {is_authed: false, token: ''};
    }
}

