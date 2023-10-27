
const { default: axios } = require('axios');
const { OSU_API_KEY } = require('../config.js');

module.exports = async (md5) => {
    const result = await axios(`https://osu.ppy.sh/api/get_beatmaps?k=${OSU_API_KEY}&h=${md5}`);
    if (result.status === 200) {
        if (result.data.length > 0) {
            return result.data.shift();
        }
        return null;
    }
    return null;
}
