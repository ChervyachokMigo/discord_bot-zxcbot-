
const { Op } = require('@sequelize/core');

const { select_mysql_model } = require("./defines.js");

const { coins_max } = require("../../settings.js");

function updateAll(Model, condition, values ){
    return Model.update(values, {where : condition, logging: false})
}

module.exports = {
    MYSQL_GET_ONE: async (action, condition) => {
        const MysqlModel = select_mysql_model(action);

        try {
            return await MysqlModel.findOne({ where: condition , logging: false, raw: true});
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error(`Нет доступа к базе данных.`);
            } else {
                throw new Error(e);
            }
        }
    },

    
    MYSQL_GET_ALL: async (action, params = {}, attributes = undefined) => {
        const MysqlModel = select_mysql_model(action);
        var condition = {};
        switch (action){
            case `daily`:
                if (typeof params.guildid === 'undefined') throw new Error('unknown guildid');
                condition = {
                    guildid: params.guildid,
                    dailynotified: false
                }
            break;
            case `voiceroles`:
                condition = {
                    chanid: { [Op.not]: '0' }
                }
            break;
            case `reactionrole`:
                if (typeof params.guildid === 'undefined') throw new Error('unknown guildid');
                if (typeof params.messageid === 'undefined') throw new Error('unknown messageid');
                condition = {
                    guildid: params.guildid,
                    messageid: params.messageid
                }
            break;
            case `remind`:
                if (typeof params.guildid === 'undefined') throw new Error('unknown guildid');
                if (params.userid){
                    condition = {
                        guildid: params.guildid,
                        userid: params.userid
                    }
                } else {
                    condition = {
                        guildid: params.guildid
                    }
                }
            break;
            case `twitchclips`:
            case `trovoclips`:
            case `vkfriend`:
                if (typeof params.userid === 'undefined') throw new Error('unknown userid');
                condition = {
                    userid: params.userid
                }
            break;

            default:
                condition = params?params:{};
            break;
        }
        try{
            return await MysqlModel.findAll ({ where: condition, logging: false, raw: true, attributes });//order: [['id', 'DESC']] 
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error(`Нет доступа к базе данных.`);
            } else {
                throw new Error(e);
            }
        }    
    },

    MYSQL_UPDATE: async (action, values) => {
        const MysqlModel = select_mysql_model(action);
        var save_values = {};
        switch (action){
            case `voiceroles_clear`:
                save_values = { chanid: '0' };
                break;
            case `channels_clear`:
                save_values = { channelid: values.systemchannelid };
                break;
            default:
                console.error(`DB: (mysql update) undefined action: ${action}`);
                break;
        }

        try{
            return await updateAll(MysqlModel, {guildid: values.guildid}, save_values );
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error(`Нет доступа к базе данных.`);
            } else {
                throw new Error(e);
            }
        }    
    },

    MYSQL_DELETE: async (action, condition) => {
        const MysqlModel = select_mysql_model(action);
        try{
            return await MysqlModel.destroy({
                where: condition, logging: false
            });
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error(`Нет доступа к базе данных.`);
            } else {
                console.error('can not delete', action, condition);
            }
        }   
    },

    MYSQL_SAVE: async ( action, keys, values) => {
        const MysqlModel = select_mysql_model(action);
    
        switch (action){
            case `user`:
                if (values.coins){
                    if (values.coins >= coins_max){
                        values.coins = coins_max;                
                    }
                    if (values.coins <= 0){
                        values.coins = 0;
                    }
                }
                break;
            case `role`:
                //или роль продается или установлена на канал
                if (!values.chanid) {
                    values.chanid = '0'
                } else {
                    values.price = -1
                }
                if (values.price){
                    if (values.price < -1){
                        values.price = -1
                    }
                    if (values.price >= coins_max){
                        values.price = coins_max
                    }
                }
                break;
            default:
                break;
        }

        if ( keys && Object.keys(keys).length > 0 ){
            values = {...values, ...keys};
        }

        try {
            if (typeof values.length !== 'undefined' && values.length > 0){
                return await MysqlModel.bulkCreate(values, {logging: false, ignoreDuplicates: true})
            } else {
                return (await MysqlModel.upsert(values, { where: keys, logging: false, raw: true })).shift();
            }
        } catch (e){
            if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                throw new Error(`Нет доступа к базе данных.`);
            } else {
                throw new Error(e);
            }
        }       
    },

}