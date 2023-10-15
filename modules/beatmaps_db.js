const { md5_stock_compare, md5_stock_calculate } = require("../beatmaps_md5_stock");
const { log } = require("../tools/log");

const moduleName = 'Beatmaps db';

module.exports = {
    init: () => {
        log('comparing stock', moduleName)
        md5_stock_compare();
        log('calculate pp', moduleName)
        md5_stock_calculate();
    }


}