
const { exec, execSync, spawnSync } = require('child_process');
const { auth_out, check_token, add_command }  = require('../api_modules/api_store_control.js');
const { execFileSync } = require('child_process');
const path = require('path');

module.exports = {
    action: async ({ip, token, name, text, args}) => {
        if (!token){
            await auth_out(ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(ip, token)){
            await add_command({name, text, args});
            return { name }
        }
    }
}