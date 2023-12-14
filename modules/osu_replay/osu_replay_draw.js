const { Image, createCanvas, loadImage  } = require('canvas');

const { NOTETYPE, NOTECOLOR } = require('./osu_note_types.js');
const settings = require('../../settings.js');
const KEYTYPE = require('../../constantes/const_osu_keys_type.js');
const HITTYPE = require('../../constantes/const_osu_hits_type.js');

const { Canvas_Resolution, NoteRadius, HitCircleOffset, timelinePosition, KeyhitsPossitionOffset,
    KeyhitHeight, CircleOverlayRadius, HitCircleRadius, keyhitPadding, playfieldHeight, 
    HitResultOffset, BigNoteHitResultOffset, HitResultSize } = require('../../constantes/const_osu_replay_draw.js');

function DrawReplay(osu_replay, drawTime = 0, zoom = settings.osu_replay_zoom_start){

    const timeline_progress = drawTime / osu_replay.lastnote.time;
    
    function drawCircle(ctx, x, y, radius, color){
        ctx.beginPath()

        ctx.fillStyle = color;
        ctx.arc(x,y,radius,0,Math.PI*2, false); // outer (filled)
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.arc(x,y,radius+CircleOverlayRadius,0,Math.PI*2, true); // outer (unfills it)
        ctx.fill();
    }

    function drawKeyhit(ctx, x, y, length, color){
        ctx.beginPath()
        ctx.fillStyle = color;
        ctx.rect(x, y, length, KeyhitHeight);
        ctx.fill();
    }

    function drawHitResult(ctx, x, y, color){
        ctx.beginPath()
        ctx.fillStyle = color;
        ctx.arc(x,y, HitResultSize, 0, Math.PI*2, false); 
        ctx.fill();
    }

    function drawProgressbar(){
        ctx.beginPath()
        ctx.fillStyle = 'green';
        ctx.rect(0, canvas.height-6, timeline_progress * canvas.width, 6);
        ctx.fill();
    }
    function drawPlayfield(){
        ctx.beginPath()
        ctx.fillStyle = '#333333';
        ctx.rect(0, timelinePosition-playfieldHeight, canvas.width, playfieldHeight*2);
        ctx.fill();
    }
    function drawText(text, x, y, size, color){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.font = `${size}px Sans`;
        ctx.fillText(text, x, y);
    }

    const canvas = createCanvas(Canvas_Resolution.w, Canvas_Resolution.h);
    const ctx = canvas.getContext('2d');

    //фон
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //полоска по которой скролятся ноты
    drawPlayfield();
    //рисование области нажатия
    drawCircle(ctx, HitCircleOffset , timelinePosition, HitCircleRadius, 'yellow');

    //рисование прогресса
    drawProgressbar();
    drawText(`${(Math.trunc(timeline_progress * 10000)/100).toFixed(2)}%`, canvas.width * 0.5 - 13, canvas.height - 16, 14, 'white');
   
   

    //рисование имени игрока
    drawText(osu_replay.playername, 7, 22, 18, 'white');
    
    //Рисование названия карты
    let mapfullname = `${osu_replay.beatmap.artist} - ${osu_replay.beatmap.title} [${osu_replay.beatmap.difficulty}]`;
    drawText(mapfullname, canvas.width-mapfullname.length*7.6, 22, 16, 'white');

    //рисовать круги
    for (let Note of osu_replay.playerhits){
        if (Note.type !== NOTETYPE.HITCIRCLE){
            continue
        }

        //доделать
        
        let color = 'yellow';

        if (Note.color == NOTECOLOR.DON) color = 'red';
        if (Note.color == NOTECOLOR.KATSU) color = 'blue';

        let x = ( Note.time - drawTime ) / 1000 * zoom;

        let radius = NoteRadius + NoteRadius * 0.5 * Note.big;

        if ( Note.time >= drawTime && x <= canvas.width + NoteRadius*2 ){
            //рисование ноты
            drawCircle(ctx, HitCircleOffset + x , timelinePosition, radius, color);

            //рисование попаданий
            if (typeof Note.hitresult ==='object' && Note.hitresult.length>1){
                let BignoteHitResultCount = 0;
                for (let bigHitresult of Note.hitresult){
                    //Рисование большой ноты
                    if (bigHitresult == HITTYPE.hit0) {
                        drawHitResult(ctx, HitCircleOffset + x - BigNoteHitResultOffset + 2 * BigNoteHitResultOffset * BignoteHitResultCount, 
                            timelinePosition - NoteRadius- HitResultOffset, 'red')
                        
                    }
                    if (bigHitresult == HITTYPE.hit100) {             
                        drawHitResult(ctx, HitCircleOffset + x - BigNoteHitResultOffset + 2 * BigNoteHitResultOffset * BignoteHitResultCount, 
                            timelinePosition - NoteRadius - HitResultOffset, 'green')
                    }
                    if (bigHitresult == HITTYPE.hit300) {     
                        //не рисовать попадания за 300  очков 
                        //drawHitResult(ctx, HitCircleOffset + x , timelinePosition-NoteRadius-HitResultOffset-10* Note.big, 'blue')
                    }
                    //неизвестное значение (не должно рисоваться)
                    if (!bigHitresult) {
                        drawHitResult(ctx, HitCircleOffset + x - BigNoteHitResultOffset + 2 * BigNoteHitResultOffset * BignoteHitResultCount, 
                            timelinePosition - NoteRadius - HitResultOffset, 'yellow')
                    }
                    BignoteHitResultCount++;
                }
            } else {
                //рисование обычной ноты
                if (Note.hitresult == HITTYPE.hit0) {
                    drawHitResult(ctx, HitCircleOffset + x , timelinePosition-NoteRadius-HitResultOffset, 'red')
                }
                if (Note.hitresult == HITTYPE.hit100) {             
                    drawHitResult(ctx, HitCircleOffset + x , timelinePosition-NoteRadius-HitResultOffset, 'green')
                }
                if (Note.hitresult == HITTYPE.hit300) {   
                    //не рисовать попадания за 300  очков     
                    //drawHitResult(ctx, HitCircleOffset + x , timelinePosition-NoteRadius-HitResultOffset, 'blue')
                }
                //неизвестное значение (не должно рисоваться)
                if (!Note.hitresult) {
                    drawHitResult(ctx, HitCircleOffset + x , timelinePosition-NoteRadius-HitResultOffset, 'yellow')
                }
            }
            
        }
        
    }

    //рисовать нажатия
    for (let hit of osu_replay.replay.hits.timeline){
        let x = ( hit.timepressed[0] - drawTime ) / 1000 * zoom;
        let hitlength = ( hit.timepressed[hit.timepressed.length-1] - hit.timepressed[0] ) / 1000 * zoom;
        let KeyNumOffset = 0;
        let color = 'white';

        if (hit.Key == KEYTYPE.DON1) KeyNumOffset = 0;
        if (hit.Key == KEYTYPE.DON2) KeyNumOffset = KeyhitHeight + keyhitPadding;

        if (hit.Key == KEYTYPE.KATSU1) KeyNumOffset = KeyhitHeight*2 + keyhitPadding*2;
        if (hit.Key == KEYTYPE.KATSU2) KeyNumOffset = KeyhitHeight*3 + keyhitPadding*3;

        if (hit.Key == KEYTYPE.DON1 || hit.Key == KEYTYPE.DON2) color = 'red';
        if (hit.Key == KEYTYPE.KATSU1 || hit.Key == KEYTYPE.KATSU2) color = 'blue';

        if ( hit.timepressed[0] >= drawTime && x<= canvas.width + NoteRadius*2 ){
            drawKeyhit(ctx, HitCircleOffset + x, 
                timelinePosition + KeyNumOffset + NoteRadius + KeyhitsPossitionOffset, hitlength, color);
        }
    }

    const buffer = canvas.toBuffer('image/png');
    return buffer
}


module.exports = {
    DrawReplay,
}