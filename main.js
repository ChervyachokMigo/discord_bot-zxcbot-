//проверка всех ролей в списке
//проверка всех эмодзи
//проверка всех каналов

//возможно переделать чтобы можно было из списка удалять

//роль бота должна быть в топе чтобы работало

//сделать лидерборд баланса
//просмотр реакций-ролей сообщения
//казино
//выбор игнорируемых каналов для ввода команд или для считывания опыта
//создание войсов
//выключение ответов бота глобально
//очистка напоминаний другому пользователю
//логирование всего
//подсчет опыта по символам 150 символов фулл
//reactionrole проверка права роли

///алиасы командам

/*чтобы справка была
и команды в единой системе
заменить owo-бота*/

//если два параметра изменятся в одно время с таймером то таймер заменит данные (возможно)

//баланс показываеит что получил сколько наприсал а не сколько реально прибавилось если преодален лимит
//добавить выбор каналов для бота: сообщения для модов отдельно
//сделать чтобы войс роль нельзя было купить или назначить на реакцию
//ремайнды переназначаются не отменяя старый таймер, оба срабатывают, не пишется что обновился.
//очистка каналов присваивает всем каналам системный

//войсроли ошибка с показом всех, показывает войсроли другой гильдии

//переписать всё через mentions

//опыт:
/*
слово больше 2 символов
слово не повторяется
разделяется пробелом
за каждое слово от 1 до 4 опыта
не больше 20 слов (140 символов макс)
но не больше 80 опыта за сообщение
повторяюющиеся сообщения не учитываются
записывать статистику юзера:
самое длинное слово,
средняя длина слова,
среднее длина сообщения,
частота сообщения (время),
отправлено сообщений (количество),
качество сообщений (длина/количество)

сброс опыта
очистка статистики

полная анонимность, слешкоманда для сообщения
глобальный чат
сделать конфиг серверо зависимым

сообщение о том что бот добавлен в другой гильдии
////информация о сервере (состоянии компа, занятой памяти, авторе)

////настройки сервера, вывод настроек

////доделать ноты реплей вьювера
////сделать перемотку к мису

 //// пофиксить баг с дейликом если юзера нет не отсылать уведомление

discord api missing  permissions видимо из-за роли выше роли бота

//пофиксить стили пост контента
////переместить тест в мейл под домен

соединить мейл и дискорд бота

*/ 
const log = console.log.bind(console)
const {DISCORD_TOKEN} = require('./config.js');

var settings = require('./settings.js');

const { Client } = require("discord.js");

const clientDiscord = new Client({
    intents: settings.intents,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});

(async function login_client(){
    try{
        await clientDiscord.login(DISCORD_TOKEN)
    } catch (e){
        if (e.code === 'TOKEN_INVALID'){
            log ('Неправильный токен, чек config.js')
        } else {
            if (e.code === 500){
                log('Нет связи.')
            } else {
                log (e.code)
            }
        }
        return false
    }
})();


const onReady = require(`./main_js_events/onReady.js`);
const voiceStateUpdate = require(`./main_js_events/voiceStateUpdate.js`);
const messageReactionActions = require(`./main_js_events/messageReactionActions.js`);
const roleDelete = require(`./main_js_events/roleDelete.js`);
const messageCreate = require(`./main_js_events/messageCreate.js`);

const joiner = require('./modules/joiner.js');

const { osu_replay_interaction } = require('./modules/osu_replay.js');

clientDiscord.on('ready', async client => await onReady.initAll(client) );

clientDiscord.on("voiceStateUpdate", async (newState, oldState) => await voiceStateUpdate(oldState,newState) );

clientDiscord.on("roleDelete", async role => await roleDelete(role));

clientDiscord.on('messageReactionAdd', async (reaction, user) => await messageReactionActions(`add`, reaction, user));
clientDiscord.on('messageReactionRemove', async (reaction, user) => await messageReactionActions(`remove`, reaction, user) );

clientDiscord.on("messageCreate", async message => await messageCreate (message) );

clientDiscord.on("guildMemberAdd", async Member => {
    if (settings.modules.joiner == true){
        await joiner.join(Member);
    }
});
    
clientDiscord.on("guildMemberRemove", async Member => {
    if (settings.modules.joiner == true){
        await joiner.remove(Member);
    }
});

clientDiscord.on('interactionCreate', async interaction =>{
    if (settings.modules.osu_replay){
        await osu_replay_interaction(interaction);
    }
})
