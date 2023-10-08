
this.channels = [];

module.exports = {
    add: (channel) => {
        const channelname = channel.replace('#', '');
        this.channels.push(channelname);
    },

    isNotExists: (channel) => {
        return this.channels.indexOf(channel) === -1
    }

}