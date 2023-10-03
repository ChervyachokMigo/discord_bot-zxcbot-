
const { exec } = require('child_process');
const { auth_out, check_token }  = require('../api_modules/api_store_control.js');
const path = require('path');

module.exports = {
    action: async (args) => {
        if (!args.token){
            await auth_out(args.ip);
            return {error: 'invalid credentials'};
        }
        if (check_token(args.ip, args.token)){
            let proc = exec( `start /D "${path.dirname(args.command)}" ${[args.command, args.args].join(' ')}` );
            return { name: args.command }
        }
    }
}