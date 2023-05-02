const settings = require(`../settings.js`)
const { LogString } = require("../tools/log.js")

const { GET_ALL_VOICEROLES, VoiceRolesClearFromUsers, AllVoiceRolesSet } = require("../modules/VoicesRoles.js")
const { StartAllRemindes } = require("../modules/remind.js")
const { getGuildChannelDB } = require("../modules/GuildChannel.js")
const { SendAnswer } = require("../tools/embed.js")

const { dailyesTimers_onStart } = require (`../modules/Daily.js`);
const { prepareDB } = require("../modules/DB.js")
const { StalkerStartListeners, StalkerStartLoop } = require(`../modules/stalker.js`);
const { twitchchat } = require(`../modules/stalker/twitchchat.js`);

const { initDisplayDataServer } = require('../displaydata/displaydata.js');

const autoRestartInit  = require('../modules/autoRestart.js');
const { init_osu_db } = require('../modules/osu_replay/osu_db.js');
const { initAvailableCommands } = require(`../modules/commands.js`);
const { initGuildSettings } = require('../modules/guildSettings.js');

const { crypto_check_start } = require('../modules/crypto.js');

const { taiko_farming_maps_initialize } = require('../modules/taiko_recomend_map/index.js');

module.exports = async (client) =>{
    try{
        initDisplayDataServer();

        await prepareDB();

        var botname = client.user.username;
        var guilds = client.guilds.cache;

        initAvailableCommands();

        if (settings.modules.stalker){  
            if (settings.modules_stalker.twitchchat){     
                 var chatevents = twitchchat();
            }
        }

        if (settings.modules.osu_replay){
            if (!await init_osu_db()){
                console.log('Невозможно загрузить osu_db');
                return false;
            };
        }

        if (settings.modules.taiko_map_recomend){
            taiko_farming_maps_initialize();
        }

        guilds.forEach( async( guild )=>{
            console.log('Старт гильдии '+guild.id)
            await initGuildSettings(guild.id);

            if (settings.modules.voiceroles){
                console.log('загрузка войсролей')
                await GET_ALL_VOICEROLES();
                await VoiceRolesClearFromUsers( guild );
                await AllVoiceRolesSet( client.channels, guild );
            };

            if (settings.modules.remind){
                console.log('загрузка напоминаний')
                await StartAllRemindes (guild);
            };

            if (settings.modules.balance){
                if (settings.modules_balance.daily){
                    await dailyesTimers_onStart(guild);
                }
            };
        
            if (settings.modules.stalker){
                console.log('запуск слушателей событий')
                await StalkerStartListeners(guild);
                console.log('запуск слушателей событий выполнено')
                if (settings.modules_stalker.twitchchat){
                    console.log('запуск чата')
                    chatevents.on('newChatMessage', async (args) => {
                        if (args.guildids && args.guildids.includes(guild.id)){
                            let channel = await getGuildChannelDB( guild, `twitchchat_${args.chatname}` );
                            await SendAnswer( {
                                channel: channel, 
                                guildname: guild.name, 
                                messagetype:`chat`, 
                                title: `${args.chatname} chat`, 
                                text: args.messagetext});
                        }
                    });
                }
            }

            if (settings.sendBotAppears){
                var botChannel = await getGuildChannelDB( guild ,`system`);
                if (!botChannel) return;
                let msgready = `Бот ${botname} появился на сервере`;
                LogString(guild.name,`info`,`Welcome`, msgready);
                
                await SendAnswer( {channel: botChannel,guildname: guild.name, messagetype: `info`, title: `Welcome`,text: msgready} );
            };
        
            if (settings.modules.crypto){
                console.log('запуск крипты..')
                await crypto_check_start(guild);
                console.log('крипта выполнено')
            }
        });
        
        if (settings.modules.stalker){
            console.log('запуск сталкера ожидание..')
            await StalkerStartLoop();
            console.log('сталкер выполнено')
        }

        if (settings.modules.autorestart){
            await autoRestartInit();
        }

        

    } catch (e){
        LogString(`System`,`Error`, 'Error', e);
    }
}