const list = [

]

const { download_by_md5_list } = require('./osu_pps/download_beatmaps_diffs');

(async () => {
    console.log(
        await download_by_md5_list(list)
    );
})();