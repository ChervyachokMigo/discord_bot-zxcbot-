
const path = require('path');

const { MessageAttachment, TextInputComponent, SelectMenuInteraction, Modal } = require('discord.js')
const { MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js');

const { getBooleanFromString, messageDeleteAfter, getObjectKeyByValue } = require("./tools.js");
const { getGuildSetting } = require('./guildSettings.js');
const { getDiscordRelativeTime, WindowsTicksToUTC } = require('../tools/time.js');

const { MYSQL_SAVE,  MYSQL_GET_ONE } = require("./DB/base.js");

const { formatSecondsToTime } = require('../tools/time.js');

const { osu_db_isLoaded } = require('./osu_replay/osu_db.js');
const { loadReplayCache, loadAttachmentCache, saveAttachmentCache } = require('./osu_replay/osu_replay_cache.js');
const { getReplayData } = require('./osu_replay/osu_replay_calculate.js');
const replayDownload = require ('./osu_replay/osu_replay_download.js');
const { DrawReplay } = require('./osu_replay/osu_replay_draw.js')

const settings = require('../settings.js');
const GAMEMODE = require('../constantes/const_osu_gamemodes.js');

function ReplayDataToText(osu_replay){
    
    let mapfullname = `${osu_replay.beatmap.artist} - ${osu_replay.beatmap.title} - ${osu_replay.beatmap.difficulty} `;
    mapfullname += `+${osu_replay.mods.join(', ')}`

    let mapurl = `https://osu.ppy.sh/beatmapsets/${osu_replay.beatmap.beatmapID}#taiko/${osu_replay.beatmap.difficultyID}`;

    var description = '';

    if (Number(osu_replay.gamemode) == GAMEMODE.MODE_TAIKO){
        description += `🎶 \`${osu_replay.beatmap.notes_info.count_hitcircles}\` `;
        description += `🔴 \`${osu_replay.beatmap.notes_info.count_don}\` `;
        description += `🔵 \`${osu_replay.beatmap.notes_info.count_katsu}\` `;
        description += `🔴🔴 \`${osu_replay.beatmap.notes_info.count_big_don}\` `;
        description += `🔵🔵 \`${osu_replay.beatmap.notes_info.count_big_katsu}\` `;
        description += `🥁 \`${osu_replay.beatmap.notes_info.count_drumroll}\` `;
        description += `🪘 \`${osu_replay.beatmap.notes_info.count_denden}\`\n`;

    }
    description += `▸ Длительность карты: ▸ \`${formatSecondsToTime(osu_replay.beatmap_length)}\` `;
    description += `▸ \`${osu_replay.difficulty_rating}★\`\n`;
    

    description += `▸ \`${osu_replay.pp}pp\` `;
    description += `▸ \`${(osu_replay.accuracy*100).toFixed(2)} %\` `;
    
    description += `▸ \`x${osu_replay.combo}/${osu_replay.beatmap_max_combo}\` `;
    description += `▸ \`🌐#${osu_replay.rank_global}\`\n`;

    description +=  `▸ Нажатия: ▸ \`🔴${osu_replay.replay.hits.counts.Key1}\` `+
    `▸ \`🔴${osu_replay.replay.hits.counts.Key3}\` `+
    `▸ \`🔵${osu_replay.replay.hits.counts.Key2}\` `+
    `▸ \`🔵${osu_replay.replay.hits.counts.Key4}\`\n`;

    description += `▸ Попадания: `;
    if (Number(osu_replay.gamemode) != GAMEMODE.MODE_TAIKO){
        description += `▸ \`300: ${osu_replay.count300}\` `;
        description += `▸ \`100: ${osu_replay.count100}\` `;
        description += `▸ \`50: ${osu_replay.count50}\` `;
    } else {
        description += `▸ \`GREAT: ${osu_replay.count300}\` `;
        description += `▸ \`GOOD: ${osu_replay.count100}\` `;
    }
    description += `▸ \`❌: ${osu_replay.countMiss}\`\n`;
    
    
    
    function isTimeWarped(modes, frametimeMost){
        let expectedFrametime = 17;
        if (modes.includes('DoubleTime') || modes.includes('Nightcore')){
            expectedFrametime = 25;
        }
        if (modes.includes('HalfTime')){
            expectedFrametime = 13;
        }
        if (frametimeMost < expectedFrametime){
            return ' ускорено?';
        }
        if (frametimeMost > expectedFrametime){
            return ' замедлено?';
        }
        return '';
    }

    description +=  `▸ Фреймтайм: ▸ \`${osu_replay.replay.frametimeAvg} (${osu_replay.replay.frametimeMost})`+
                    `${isTimeWarped(osu_replay.mods, osu_replay.replay.frametimeMost)}\`\n`;

    var embed = {
        author: {
            name: `Replay: ${osu_replay.playername} (${getObjectKeyByValue(Number(osu_replay.gamemode), GAMEMODE).replace('MODE_','')})`,
        },
        title: mapfullname,
        url: mapurl,
        description: description,
        timestamp: getDiscordRelativeTime(WindowsTicksToUTC(osu_replay.date)),

    }
    return embed;
}

function NewButtons(){
    return [
        new MessageActionRow().addComponents([
            new MessageButton()
                .setCustomId('PrevMiss')
                .setLabel('◀️❌')
                .setStyle('PRIMARY')
                .setDisabled(false),
            new MessageButton()
                .setCustomId('NextMiss')
                .setLabel('❌▶️')
                .setStyle('PRIMARY')
                .setDisabled(false),
            new MessageButton()
                .setCustomId('ReplayPrev')
                .setLabel('⏪')
                .setStyle('PRIMARY')
                .setDisabled(false),
            new MessageButton()
                .setCustomId('ReplayNext')
                .setLabel('⏩')
                .setStyle('PRIMARY')
                .setDisabled(false),
            new MessageButton()
                .setCustomId('KillNibbers')
                .setLabel('🧑🏿🔫')
                .setStyle('PRIMARY')
                .setDisabled(false)
        ]),
        new MessageActionRow().addComponents([
            new MessageButton()
                .setCustomId('ReplayZoomInc')
                .setLabel('🔍➕')
                .setStyle('PRIMARY')
                .setDisabled(false),
            new MessageButton()
                .setCustomId('ReplayZoomDec')
                .setLabel('🔍➖')
                .setStyle('PRIMARY')
                .setDisabled(false)
        ]),
        new MessageActionRow().addComponents([
        new MessageSelectMenu()
            .setCustomId('SkinSelect')
            .setPlaceholder('Выбери шкуру')
            .setDisabled(false)
            .addOptions([{
                label: 'Без шкур',
                value: 'no_skin',
            },{
                label: '!izede',
                value: '!izede',
            },{
                label: 'fieryrage 2017-08-10',
                value: 'fieryrage 2017-08-10',
            }
        
        ])
        ])
    ]
}

module.exports = {
    
    messageReplayCheck: async function (message){

        if (!(getBooleanFromString(getGuildSetting(message.guild.id, 'osu_replay')))) return false;

        if (message.attachments.size>0){
            message.attachments.forEach(async (atachment)=>{
                if(path.extname(atachment.name) === '.osr'){

                    if (!osu_db_isLoaded()) {
                        await message.reply(`Сервер в процессе загрузки, подождите немного.`);
                        return false;
                    }

                    let replayLocalPath = await replayDownload( atachment , message.author );

                    if(!replayLocalPath){
                        await message.reply(`Ошибка реплея.`);
                        return false;
                    }

                    var replaydata = await getReplayData(replayLocalPath);

                    if (replaydata.error){
                        await message.reply({ content: replaydata.error });
                        return false
                    }

                    //рисуем реплей из тайко
                    if (replaydata.gamemode == GAMEMODE.MODE_TAIKO){
                        const imageAttachment = new MessageAttachment(
                            DrawReplay(
                                replaydata,
                                settings.osu_replay_time_start, 
                                settings.osu_replay_zoom_start), 
                                "image-attachment.png");

                        let sended_embed = ReplayDataToText(replaydata);
                        
                        let sended_message = await message.reply({ 
                            embeds: [sended_embed],
                            files:[imageAttachment], 
                            components: NewButtons()});

                        await saveAttachmentCache({
                                imageid: sended_message.attachments.first().id, 
                                userid: message.author.id, 
                                beatmapid: replaydata.beatmap_md5, 
                                replayid: replaydata.replay_md5, 
                                time: settings.osu_replay_time_start, 
                                zoom: settings.osu_replay_zoom_start});
                    //реплей не из тайко
                    } else {
                        let sended_embed = ReplayDataToText(replaydata);
                        await message.reply({ embeds: [sended_embed]});
                    }
                    //надо сделать последний реплей saveLastReplay(replaydata.replay_md5, message.author.id)
                
                }
            });
        }
    },

    osu_replay_interaction: async function (interaction){
        //(imageid, userid, beatmapid, replayid, time, zoom)
        try{
            console.log(interaction)
            if(interaction.isButton()) {
                if (interaction.message.attachments.size == 0) {
                    interaction.reply({ content: 'Нет атачмента', ephemeral: true });
                    return false;
                }

                let oldAttachment = interaction.message.attachments.first();
                
                let attachment = await loadAttachmentCache(oldAttachment.id, interaction.user.id);

                if (typeof attachment === 'undefined'){
                    await interaction.reply({ content: 'Нет данных или реплей не ваш', ephemeral: true });
                    return false;
                }
                if (attachment.userid !== interaction.user.id){
                    await interaction.reply({ content: 'Изменить может только владелец', ephemeral: true });
                    return false;
                }

                if (interaction.customId === 'KillNibbers'){
                    let nibbers = await MYSQL_GET_ONE('nibbers', {userid: interaction.user.id});
                    if (nibbers == null){
                        nibbers = 1;
                    } else {
                        nibbers = nibbers.dataValues.nibbers;
                        nibbers++;
                    }
                    await MYSQL_SAVE ('nibbers', {userid: interaction.user.id}, {nibbers});
                    let nibbermessage = await interaction.message.reply('Убит один негр. '+`${interaction.user} всего убил ${nibbers} негров`);
                    
                    await interaction.channel.bulkDelete([interaction.message.id, interaction.message.reference.messageId])
                    
                    messageDeleteAfter(nibbermessage, 20);
                    return true
                }

                let replaydata = await loadReplayCache(attachment.replayid);
                if (!replaydata){
                    await interaction.reply({ content: 'Реплей не сохранен', ephemeral: true });
                    return false;
                }

                const missTimeOffset = 100;
                const replay_inc_multiplier = 0.67;
                const osu_replay_time_inc = (640 - 120) / attachment.zoom * 1000 * replay_inc_multiplier;

                switch (interaction.customId){
                    case 'ReplayZoomInc': 
                        if (attachment.zoom < 100){
                            if (attachment.zoom < settings.osu_replay_zoom_min) attachment.zoom = settings.osu_replay_zoom_min;
                            attachment.zoom = attachment.zoom * 2;
                        } else {
                            if (attachment.zoom > 500){
                                attachment.zoom += settings.osu_replay_zoom_inc*2;
                            } else {
                                attachment.zoom += settings.osu_replay_zoom_inc;
                            }
                            if (attachment.zoom > settings.osu_replay_zoom_max) attachment.zoom = settings.osu_replay_zoom_max;
                        }
                        break;
                    case 'ReplayZoomDec': 
                        if (attachment.zoom <= 100){
                            attachment.zoom = attachment.zoom / 2;
                            if (attachment.zoom < settings.osu_replay_zoom_min) attachment.zoom = settings.osu_replay_zoom_min;
                        } else {
                            if (attachment.zoom > 500){
                                attachment.zoom -= settings.osu_replay_zoom_inc*2;
                            } else {
                                attachment.zoom -= settings.osu_replay_zoom_inc;
                            }
                        }
                        break;
                    case 'PrevMiss': 
                        let prevmiss = (replaydata.playersmisses.filter(val=> val.time < attachment.time + missTimeOffset)).pop();
                        if (prevmiss != undefined){
                            attachment.time = prevmiss.time - missTimeOffset;
                        }                        
                        break;
                    case 'NextMiss': 
                        let nextmiss = (replaydata.playersmisses.filter(val=> val.time > attachment.time + missTimeOffset)).shift();
                        if (nextmiss != undefined){
                            attachment.time = nextmiss.time - missTimeOffset;
                        }                        
                        break;
                    case 'ReplayNext': 
                        if (attachment.time + osu_replay_time_inc <= replaydata.lastnote.time){
                            attachment.time += osu_replay_time_inc ;

                        } else {
                            attachment.time = replaydata.lastnote.time;
                        }
                        break;
                    case 'ReplayPrev': 
                        if (attachment.time >= osu_replay_time_inc){
                            attachment.time -= osu_replay_time_inc;
                        } else {
                            attachment.time = 0;
                        }
                        break;
                    break;
                }
                
                const imageAttachment = new MessageAttachment(
                    DrawReplay(
                        replaydata, 
                        attachment.time, 
                        attachment.zoom), 
                        "image-attachment.png"); 

                let updatedmessage = await interaction.update({ 
                    fetchReply: true , 
                    files:[imageAttachment]});

                await saveAttachmentCache({
                        imageid: updatedmessage.attachments.first().id, 
                        userid: interaction.user.id, 
                        beatmapid: replaydata.beatmap_md5, 
                        replayid: replaydata.replay_md5, 
                        time: attachment.time, 
                        zoom: attachment.zoom});
            }
        } catch (e){
            console.log(e)
            return 
        }
    },
}


