const { valid_key, remove_key, authtorize, validate_token }  = require('../api_modules/api_store.js');

module.exports = {
    action: async (args) => {
        if (!args.auth_key){
            return {error: 'no auth_key'};
        }

        if (valid_key (args.ip, args.auth_key)){ 
            await authtorize(args.ip);
        } 
        
        remove_key (args.ip);
        return await validate_token(args.ip);
    }
}