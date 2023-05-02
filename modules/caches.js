

var caches = {};

function getCacheValue(cache_name, cache_property_name, cache_property_value){
    if (caches[cache_name] == undefined) return [];
    return caches[cache_name].filter(val=>val[cache_property_name] === cache_property_value)
}

function saveCache(cache_name, cache_data, cache_unique_property_name){
    if (cache_data instanceof Array == false ){
        cache_data = [cache_data];
    }
    if (caches[cache_name] == undefined){
        caches[cache_name] = cache_data;
    } else {
        let tmp_arr = cache_data.concat(caches[cache_name]);
        caches[cache_name] = tmp_arr.filter((item, i, arr)=>{
            return arr.findIndex(v => v[cache_unique_property_name] === item[cache_unique_property_name]) === i;
        })
    }
    return caches[cache_name];
}

function loadCache(cache_name){
    return caches[cache_name];
}

module.exports = {
    saveCache: saveCache,
    loadCache: loadCache,
    getCacheValue: getCacheValue,
}