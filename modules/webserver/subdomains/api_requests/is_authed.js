
const { validate_token }  = require('../api_modules/api_store.js');

module.exports = {
    action: async (args) => {
        return await validate_token(args.ip);
    }
}
