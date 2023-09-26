const fs = require('fs');
const path = require('path');

const { auth_out, check_token }  = require('../api_consts/api_store.js');

const { mail_db_path, mailRegex, dateRegex } = require('../api_consts/api_settings.js');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(args.ip);
            return {error: 'invalid credentials'};
        }
        
        if (check_token(args.ip, args.token)){
            const escaped_addressee = decodeURI(args.addressee).replace(mailRegex, '');
            const matchedDate = decodeURI(args.post).match(dateRegex, '');
            const escaped_post = matchedDate !== null ? matchedDate.shift() : '';

            if (!escaped_addressee) {
                return {error: 'no addressee'};
            }
            if (!escaped_post) {
                return {error: 'no post'};
            }

            const filepath = path.join( mail_db_path, escaped_addressee, escaped_post);
            
            if (fs.existsSync(filepath)){
                return {content: fs.readFileSync(filepath, {encoding: 'utf-8'})};
            } else {
                await auth_out(args.ip);
                return {error: 'invalid path'};
            } 
        }
    }
}