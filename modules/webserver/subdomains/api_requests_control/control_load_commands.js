
const { auth_out, check_token, load_commands }  = require('../api_modules/api_store_control.js');

const path = require('path');

module.exports = {
    action: async ({ip, token}) => {
        if (!token){
            await auth_out(ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(ip, token)){
            
            return { commands: await load_commands() }
        }
    }
}