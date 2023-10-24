const mod_names = [
    'NF', 'EZ',
    'TD', 'HD', 'HR',
    'SD', 'DT', 'RX',
    'HT', 'NC',  'FL',
    'AP', 'SO'
];

const IntToMods = (mods_int) => {
    let result_mods = [];

    if (mods_int === 0){
        return result_mods;
    }

    for ( let i = 0; i<mod_names.length; i++ ){
        if (mods_int >> i & 1){
            result_mods.push(mod_names[i]);
        }
    }
    
    return result_mods
}

const ModsToInt = (mods) => {
    let result = 0;

    for ( let i = 0; i<mod_names.length; i++ ){
        if (mods.indexOf(mod_names[i]) > -1){
            result = result | 1 << i;
        }
    }

    return result;
}

module.exports = {
    ModsToInt: ModsToInt,
    IntToMods: IntToMods
}