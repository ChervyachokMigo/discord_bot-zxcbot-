const commandPermissions = require("../constants/enumPermissions");
const { ModerationName } = require("../constants/general");

module.exports = {
    getUserPermission: (channelname, username) => {

        if (channelname === ModerationName && username === ModerationName) {
            return commandPermissions.SELF;
        } else if (channelname === ModerationName) {
            return commandPermissions.CHANNEL;
        } else {
            return commandPermissions.ALL;
        }
        
    }
}