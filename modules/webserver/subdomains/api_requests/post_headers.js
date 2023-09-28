

const { auth_out, check_token, load_mail_posts }  = require('../api_modules/api_store.js');

const { mailRegex } = require('../api_consts/api_settings.js');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(args.ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(args.ip, args.token)){
            const escaped_addressee = decodeURI(args.addressee).replace(mailRegex, '');

            if (!escaped_addressee) {
                return {error: 'no addressee'};
            }

            return { posts: await load_mail_posts({addressee: escaped_addressee}) };
            
        }
    }
}