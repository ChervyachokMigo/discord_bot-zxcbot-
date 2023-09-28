
const { auth_out, check_token, delete_post }  = require('../api_modules/api_store.js');

const { postKeyRegex } = require('../api_consts/api_settings.js');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(args.ip);
            return {error: 'invalid credentials'};
        }
        
        if (check_token(args.ip, args.token)){
            const unique_key = decodeURI(args.unique_key).replace(postKeyRegex, '');

            if (!unique_key) {
                return {error: 'no unique_key'};
            }

            const result = await delete_post({unique_key});
            if (!result) {
                return {error: 'post not found'}
            }
            return { delete: true };

        }
    }
}