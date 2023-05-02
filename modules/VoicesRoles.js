const { MYSQL_UPDATE, MYSQL_SAVE, MYSQL_GET_ALL, MYSQL_DELETE } = require (`./DB.js`);

const { fetchVoiceChannel, comargQuotesStringJoin, getLinkFromRoleID } = require("./tools.js")
const { checkArgsOfRole, isRoleBot, RoleToUser, fetchRole } = require("./roles.js")
const { SendAnswer, SendError } = require("../tools/embed.js")
const { LogString } = require("../tools/log.js")

var VoicesRoles = [];

module.exports = {
    VoiceRoleSet: async function( comargs, message, com_text ){
        var guildid = message.guild.id;
        
        //две одинаково названные роли не сочетаются, т.к. проверка роли идёт по имени
        if (!await message.guild.members.cache.find(u=>u.id === message.author.id).permissions.has("MANAGE_ROLES")){    
            await SendError(message, com_text, `${message.author.username}, у Вас нет прав управлять ролями`);        
            return
        }

        if (!comargs[0]){
            await module.exports.printVoicesRoles( com_text, message );
            return
        }

        if (comargs[0] === 'clear'){
            await module.exports.VoiceRolesClearFromUsers ( message.guild );
            VoicesRoles = [];
            await MYSQL_UPDATE(`voiceroles_clear`, {guildid:guildid})  ;     
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:   `Голосовые каналы очищены от ролей.`,
                mentionuser:  `${message.author}`} );
            return
        }
        //поиск имени канала в строке
        var voicerole_channelname = await comargQuotesStringJoin( 0 ,comargs, com_text, message)
        if (!voicerole_channelname) return
        
        if (voicerole_channelname === -1){
            if ( comargs.length > 2 ){
                for (var i = 0; i < comargs.length-1; i++ ){
                    if (i == 0){
                        voicerole_channelname = comargs[0];
                    } else {
                        voicerole_channelname = `${voicerole_channelname} ${comargs[i]}`
                    }
                }
            } else {
                voicerole_channelname = comargs[0];  //шорткат, если агрумента два, то искомый найден
            }
        }
        
        var voicerole_channels = await fetchVoiceChannel(message.guild.channels.cache, voicerole_channelname)

        if (!voicerole_channels || voicerole_channels.size == 0) {   
            await SendError(message, com_text, `Такого голосового канала не существует`);    
            return
        }

        if (!voicerole_channels || voicerole_channels.size > 1) {  
            await SendError(message, com_text, `У вас несколько каналов с таким названием! Поменяйте и попробуйте еще раз`);     
            return
        }

        var voicerole_role = await checkArgsOfRole(comargs[comargs.length-1], com_text, message)
        if (!voicerole_role) return

        //формирование новой записи о войсроли
        var voicerole_completenum = 0
        var NewVoicesRoles = []
        await voicerole_channels.each(function (chan){
            if (chan.type === 'GUILD_VOICE'){
                NewVoicesRoles.push({dataValues:{'chanid':chan.id,'roleid':voicerole_role.id}});
                voicerole_completenum++;
            }
        })

        await module.exports.addVoicesRoles(NewVoicesRoles)
        
        if (voicerole_completenum == 0){    
            await SendError(message, com_text, `Это не голосовой канал: ${voicerole_channelname}`);    
        } else {
            await MYSQL_SAVE(`role`, {guildid: guildid, roleid: voicerole_role.id}, {chanid: NewVoicesRoles[0].dataValues.chanid})
            await module.exports.VoiceRolesClearFromUsers ( message.guild )
            await module.exports.AllVoiceRolesSet( message.guild.channels , message.guild)
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:  `Голосовому каналу "${voicerole_channelname}" установлена роль ${voicerole_role}`,
                mentionuser:  `${message.author}`} );
        }
    },

    printVoicesRoles: async function ( com_text, message ){ 
        if (VoicesRoles && VoicesRoles.length>0){
            var msg = {
                title:'Voice Role',
                description: `Команда: ${com_text.help}`,
                fields: []
            }
           
            for (var vr of VoicesRoles){

                let chans = await fetchVoiceChannel(message.guild.channels.cache, '', vr.dataValues.chanid)
                await chans.each(async function (chan){
                    msg.fields.push({name: chan.name, value: getLinkFromRoleID(vr.dataValues.roleid) , inline: false})
                })

            }

            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                mentionuser:  `${message.author}`, 
                fields: msg.fields } );
        } else {
            await SendAnswer( {channel: message.channel,
                guildname: message.guild.name,
                messagetype: `info`,
                title: com_text.name,
                text:  `Роли на голосовые каналы не назначены. Команда: ${com_text.help}`,
                mentionuser:  `${message.author}`} );            
        }
    },

    addVoicesRoles: async function ( NewVoicesRoles ){
        for (var vr_new of NewVoicesRoles){
            let isVoicesRolesEqualsNew = false
            if ( VoicesRoles.length > 0 ){
                for (var i = 0; i < VoicesRoles.length; i++){
                    if (VoicesRoles[i].dataValues.chanid === vr_new.dataValues.chanid){
                        VoicesRoles[i].dataValues.roleid = vr_new.dataValues.roleid
                        isVoicesRolesEqualsNew = true
                        break
                    }
                }
            }
            if (isVoicesRolesEqualsNew == false){
                VoicesRoles.push(vr_new)
            }
        }
    },


    GET_ALL_VOICEROLES:async function(){
        VoicesRoles = await MYSQL_GET_ALL(`voiceroles`)
    },
    
    VoiceRolesClearFromUsers: async function ( guild ){
        if (!VoicesRoles || VoicesRoles.length == 0){
            VoicesRoles = []
        }
        if (VoicesRoles.length>0){
            //удалить несуществующие войсроли
            await module.exports.removeUndefinedVoicesRoles( guild ) 
            //удалить войсроли со юзеров
            var members = await guild.members.fetch(member => typeof member !== 'undefined')    //все мемберы
            await members.forEach(async function (member){
                member.roles.cache.forEach(async function (role){
                    if (member.user.bot) return
                    for (var vr of VoicesRoles){
                        if ( !await isRoleBot(role)) {
                            if (role.id === vr.dataValues.roleid){
                                await RoleToUser('remove', member, vr.dataValues.roleid, `Voices Roles`)
                            }
                        }
                    }
                })
            })
        }
    },

    removeUndefinedVoicesRoles: async function ( guild ){
        for (var vr of VoicesRoles){
            if (vr.guildid === guild.id){
                var role = await guild.roles.cache.find(roleFind => roleFind.id === vr.dataValues.roleid)
                var chan = await guild.channels.cache.find(channelFind => channelFind.id == vr.dataValues.chanid)
                if (typeof role === 'undefined'){
                    await module.exports.removeVoicesRolesByRole( vr.dataValues.roleid )
                    await MYSQL_DELETE(`role`, {guildid: guild.id, roleid: vr.dataValues.roleid})
                    continue
                }
                if (typeof chan === 'undefined'){
                    await module.exports.removeVoicesRolesByChanID( vr.dataValues.chanid )
                    await MYSQL_SAVE( `role`, {guildid: guild.id, roleid: vr.dataValues.roleid}, {chanid: 0})
                }
            }
        }
    },

    removeVoicesRolesByRole: async function (roleid){
        var indexDel = -1
        for (var i = 0; i < VoicesRoles.length; i++){
            if (VoicesRoles[i].dataValues.roleid === roleid){
                indexDel = i
                break
            }
        }
        if (indexDel >= 0 ){
            VoicesRoles.splice(indexDel,1)
        }
    },

    removeVoicesRolesByChanID: async function (chanid){
        var indexDel = -1
        for (var i = 0; i < VoicesRoles.length; i++){
            if (VoicesRoles[i].dataValues.chanid === chanid){
                indexDel = i
                break
            }
        }
        if (indexDel >=0 ){
            VoicesRoles.splice(indexDel,1)
        }
    },

    AllVoiceRolesSet: async function ( channels, guild ){
        for (var vr of VoicesRoles){
            var chan = await channels.fetch(vr.dataValues.chanid)
            await chan.members.forEach(async function (member){
                await module.exports.UpdateVoiceRoles('connected', vr.dataValues.chanid, member)
            })
        }
        
        LogString(guild.name, `info`, `Voices Roles`,`Все роли назначены`);
    },

    UpdateVoiceRoles: async function (state, chanid, member){
        for (var vr of VoicesRoles){
            if (vr.dataValues.chanid === chanid){
                if (state == 'connected'){
                    await RoleToUser('add', member, vr.dataValues.roleid, `Voices Roles`)
                    LogString(member.guild.name, `info`, `Voices Roles`, 
                    `${member.user.username} назначена роль ${(await fetchRole(member.guild , vr.dataValues.roleid)).name}`);
                }
                if (state == 'disconnected'){
                    await RoleToUser('remove', member, vr.dataValues.roleid, `Voices Roles`)
                    LogString(member.guild.name, `info`, `Voices Roles`, 
                    `${member.user.username} убрана роль ${(await fetchRole(member.guild , vr.dataValues.roleid)).name}`);
                }
            }
        }
    }



}