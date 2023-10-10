const { MYSQL_ADD_TWITCH_OSU_BIND } = require("../../DB");

const key_digits_base_length = 6;

let keys = [];

module.exports = {
    generate_key: (twitch_user, osu_user) =>{
        const key = parseInt(Math.random().toString().slice(2, 2 + key_digits_base_length));
        const keypair = {
            twitch: {
                id: twitch_user['user-id'], 
                name: twitch_user.username
            }, 
            osu: {
                id: osu_user.userid,
                name: osu_user.username
            }, 
            key
        };
        keys.push(keypair);
        console.log(keys)
        return keypair;
    },

    check_key: async (twitch_user, responsed_key) => {
        const result = keys.find( k => 
            k.twitch.id === twitch_user['user-id'] && 
            k.key === responsed_key
        );

        if (!result) {
            return false
        }

        await MYSQL_ADD_TWITCH_OSU_BIND(result);
        keys = keys.filter(k => k.twitch.id !== twitch_user['user-id'] );
        console.log(keys)
        return result;
    }
}