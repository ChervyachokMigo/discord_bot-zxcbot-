const { auth_out, check_token, load_mail_post_content, add_ignore_email }  = require('../api_modules/api_store_mail.js');

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

            const result = await load_mail_post_content({unique_key});
            if (result === null) {
                return {error: 'post not found'}
            }
            const email_name = result.from;

            await add_ignore_email(email_name);

            return { email_name };

        }
    }
}