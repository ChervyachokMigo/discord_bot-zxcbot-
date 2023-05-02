const NOTETYPE = {
    HITCIRCLE: 1,
    SLIDER: 2,
    SPINNER: 3
}
const NOTECOLOR = {
    DON: 1,
    KATSU: 2
}

module.exports = {
    NOTETYPE: NOTETYPE,
    NOTECOLOR: NOTECOLOR,
    
    getNoteTypeByNoteBits:function (notedata){
        let isHitCircle = Boolean(notedata.type[notedata.type.length-1]);
        let isSlider = Boolean(notedata.type[notedata.type.length-2]);
        let isSpinner = Boolean(notedata.type[notedata.type.length-4]);

        let isKatsu = Boolean(notedata.hitSound[notedata.hitSound.length-4])  //clap
        || Boolean(notedata.hitSound[notedata.hitSound.length-2]);       //whistle
        let isDon = !isKatsu || Boolean(notedata.hitSound[notedata.hitSound.length-1]);   //normal

        let isBig = Boolean(notedata.hitSound[notedata.hitSound.length-3]);   //finish
    
        //доделать

        var note = {};

        note.time = notedata.time;

        if (isHitCircle){

            note.type = NOTETYPE.HITCIRCLE;

            if (isDon){
                note.color = NOTECOLOR.DON;
            }

            if (isKatsu){
                note.color = NOTECOLOR.KATSU;
            }

            note.big = isBig;
            
        } else {
            if (isSlider){
                note.type = NOTETYPE.SLIDER;
            } else {
                if (isSpinner){
                    note.type = NOTETYPE.SPINNER;
                } else {
                    return false;
                }
            }
            
        }
        return note;
    },
}