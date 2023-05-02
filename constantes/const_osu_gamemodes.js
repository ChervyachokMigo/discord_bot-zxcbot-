module.exports = {
    MODE_STD: 0,
    MODE_TAIKO: 1,
    MODE_CTB: 2,
    MODE_MANIA: 3,
    mode_to_text: function (mode){
        switch (mode){
            case 0: 
            case '0':
                return 'osu'
            case 1: 
            case '1': 
                return 'taiko'
            case 2: 
            case '2': 
                return 'fruits'
            case 3: 
            case '3': 
                return 'mania'
        }
    }
}