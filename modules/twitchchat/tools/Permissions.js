const Permissions = require("../constants/enumPermissions");
const { ModerationName } = require("../constants/general");

module.exports = {
    getUserPermission: (channelname, username) => {

        if (channelname === ModerationName && username === ModerationName) {
            return Permissions.SELF;
        } else if (channelname === ModerationName) {
            return Permissions.CHANNEL;
        } else {
            return Permissions.ALL;
        }
        
    }
}