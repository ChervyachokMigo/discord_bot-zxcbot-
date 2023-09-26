const fs = require('fs');
const { auth_out, check_token }  = require('../api_consts/api_store.js');

const { mail_db_path } = require('../api_consts/api_settings.js');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(args.ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(args.ip, args.token)){
            if (fs.existsSync(mail_db_path)){
                return { inbox: fs.readdirSync(mail_db_path) };
            } else {
                await auth_out(args.ip);
                return {error: 'invalid path'};
            } 
        }
    }
}