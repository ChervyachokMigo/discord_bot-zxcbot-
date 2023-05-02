const bitwise = require( 'bitwise');

const mod_names = ['NoFail',     'Easy',
'TouchDevice', 'Hidden',     'HardRock',
'SuddenDeath', 'DoubleTime', 'Relax',
'HalfTime',    'Nightcore',  'Flashlight',
'Autoplay',    'SpunOut',    'Relax2',
'Perfect',     'Key4',       'Key5',
'Key6',        'Key7',       'Key8',
'FadeIn',      'Random',     'Cinema',
'Target',      'Key9',       'KeyCoop',
'Key1',        'Key3',       'Key2',
'ScoreV2',     'Mirror']

module.exports = {
    calculateMods:  function (modsBits) {
        if (modsBits == 0){
            return ['No Mods'];
        }
        let result_mods = [];

        for (let i = 0 ; i < 32; i++){
            let bit = bitwise.integer.getBit(modsBits, i);
            if (bit){
                result_mods.push(mod_names[i]);
            }
            
        }
        
        return result_mods
    }
}
