const settings = require(`../settings.js`)
const { log } = require("../tools/log.js")

const { LOAD_ALL_VOICEROLES, VoiceRolesClearFromUsers, AllVoiceRolesSet } = require("../modules/VoicesRoles.js")
const { StartAllRemindes } = require("../modules/remind.js")
const { getGuildChannelDB } = require("../modules/GuildChannel.js")
const { SendAnswer } = require("../tools/embed.js")

const { dailyesTimers_onStart } = require (`../modules/Daily.js`);

const { StalkerStartListeners, StalkerStartLoop } = require(`../modules/stalker.js`);
const { twitchchat_init, twitchchat_refresh_category } = require(`../modules/twitchchat/twitchchat.js`);

const { initLogServer } = require('../modules/logserver/index.js');

const { init_osu_db } = require('../modules/osu_replay/osu_db.js');
const discord_commands = require(`../modules/commands.js`);

const { initGuildSettings } = require('../modules/guildSettings.js');

const { crypto_check_start } = require('../modules/crypto.js');

const { taiko_farming_maps_initialize } = require('../modules/taiko_recomend_map/index.js');

const websettings = require('../modules/websettings/index.js');

const webserver = require('../modules/webserver/index.js');

const mailer_events = require('../modules/mailer/mailer-events.js');
const mailer_main = require('../modules/mailer/mailer-main.js');
const { setInfinityTimerLoop } = require("../modules/tools.js")
const { svdgod_guild_id } = require("../constantes/general.js")
const { prepareDB } = require("../modules/DB/defines.js")
const { twitchchat_load_events } = require("../modules/twitchchat/tools/GuildEvents.js");
const { loadTwitchChatCommands, viewCommands } = require("../modules/twitchchat/tools/AvailableCommands.js")
const { init_osu_irc } = require("../modules/twitchchat/tools/ircManager.js")

module.exports = {
    initAll: async (client) =>{
        try{
            //initLogServer();

            await prepareDB();

            var botname = client.user.username;
            var guilds = client.guilds.cache;

            discord_commands.initAvailableCommands();

            if (settings.modules.websettings) {
                log('запуск веб сервера настроек', 'initialisation');
                await websettings.init();
                await websettings.setDiscordData(client);
            }

            if (settings.modules_stalker.twitchchat){   
                init_osu_irc();
                loadTwitchChatCommands();
                await twitchchat_init();
                setInfinityTimerLoop(twitchchat_refresh_category, 300); 
            }

            if (settings.modules.osu_replay){
                if (!await init_osu_db()){
                    log('Невозможно загрузить osu_db', 'initialisation');
                    return false;
                };
            }

            if (settings.modules.taiko_map_recomend){
                taiko_farming_maps_initialize();
            }

            guilds.forEach( async( guild )=>{

                log('Старт гильдии ['+guild.id+'] ' + guild.name, 'initialisation');

                if ( guild.id.toString() === svdgod_guild_id ){
                    mailer_main.init();
                    mailer_events.init(guild);
                    webserver.init();

                    if (settings.modules_stalker && settings.modules_stalker.twitchchat){
                        log('запуск событий чата', 'initialisation');
                        twitchchat_load_events(guild);
                    }
                }
                

                await initGuildSettings(guild.id);

                if (settings.modules.crypto){
                    log('запуск крипты..', 'initialisation');
                    await crypto_check_start(guild);
                    log('крипта выполнено', 'initialisation');
                }

                if (settings.modules.voiceroles){
                    log('загрузка войсролей', 'initialisation');
                    await LOAD_ALL_VOICEROLES();
                    await VoiceRolesClearFromUsers( guild );
                    await AllVoiceRolesSet( client.channels, guild );
                };

                if (settings.modules.remind){
                    log('загрузка напоминаний', 'initialisation');
                    await StartAllRemindes (guild);
                };

                if (settings.modules.balance){
                    if (settings.modules_balance.daily){
                        await dailyesTimers_onStart(guild);
                    }
                };
            
                if (settings.modules.stalker){
                    log('запуск слушателей событий', 'initialisation');
                    await StalkerStartListeners(guild);
                    log('запуск слушателей событий выполнено', 'initialisation');
                }

                if (settings.sendBotAppears){
                    var botChannel = await getGuildChannelDB( guild ,`system`);
                    if (!botChannel) return;
                    let msgready = `Бот ${botname} появился на сервере`;
                    log (msgready, 'initialisation');                
                    await SendAnswer( {channel: botChannel,guildname: guild.name, messagetype: `info`, title: `Welcome`,text: msgready} );
                };
            
            });

            if (settings.modules.stalker){
                log('запуск сталкера ожидание..', 'initialisation');
                await StalkerStartLoop();
                log('сталкер выполнено', 'initialisation');
            }

            log('инициализация выполнена', 'initialisation complete');

        } catch (e){
            log(e.toString(), 'initialisation error');
            console.log(e)
        }
    }
}