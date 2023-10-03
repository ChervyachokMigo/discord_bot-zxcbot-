const {  valid_key, authtorize, remove_key, validate_token }  = require('../api_modules/api_store_control.js');

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