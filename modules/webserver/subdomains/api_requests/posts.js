const fs = require('fs');
const path = require('path');

const { auth_out, check_token }  = require('../api_consts/api_store.js');

const { mail_db_path, mailRegex } = require('../api_consts/api_settings.js');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(args.ip, args.token)){
            const escaped_addressee = decodeURI(args.addressee).replace(mailRegex, '');

            if (!escaped_addressee) {
                return {error: 'no addressee'};
            }

            const filepath = path.join( mail_db_path, escaped_addressee);
            if (fs.existsSync(filepath)){
                return { posts: fs.readdirSync(filepath) };
            } else {
                await auth_out(args.ip);
                return {error: 'invalid path'};
            } 
        }
    }
}