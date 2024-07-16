const { DataTypes } = require('@sequelize/core');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DISCORD, DB_TWITCHCHAT } = require("../../config.js");
const { prepareDB, prepareEND, discord_prepare } = require('mysql-tools');

module.exports = {
    prepareDB: async () => {

				
		try {

			const connections = await prepareDB({ 
				DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DATABASES: { DB_DISCORD, DB_TWITCHCHAT } 
			});
			
			const discord_connection = 		connections.find( x=> x.name === DB_DISCORD )?.connection;
			const twitchchat_connection = 	connections.find( x=> x.name === DB_TWITCHCHAT )?.connection;
			
			if (!discord_connection) {
				throw new Error('discord_connection connection undefined');
			}

			if (!twitchchat_connection) {
				throw new Error('twitchchat_connection connection undefined');
			}
			
			discord_prepare(discord_connection, twitchchat_connection);

			await prepareEND();

		} catch (e) {
			console.error(e);
			throw new Error(e);
		}

		return true;

	}

}