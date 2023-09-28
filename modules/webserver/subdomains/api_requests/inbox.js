const fs = require('fs');
const { auth_out, check_token, load_mail_addressees }  = require('../api_modules/api_store.js');

const { mail_db_path } = require('../api_consts/api_settings.js');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(args.ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(args.ip, args.token)){
            return { inbox: await load_mail_addressees() };
        }
    }
}