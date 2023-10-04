const { auth_key_digits_base_length, auth_key_digits_extra_length, 
    token_literals, key_timeout } = require('../api_consts/api_settings.js');

module.exports = {

    generate_auth_key: (ip) => {
        const digits = auth_key_digits_base_length + Math.floor(Math.random() * auth_key_digits_extra_length);
        const key = Math.random().toString().slice(2, 2 + digits);
        return {ip, key, key_timeout};
    },

    generate_token: (length = 32) => {
        let token = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * token_literals.length);
            token += token_literals.charAt(randomIndex);
        }
        return token;
    },

}