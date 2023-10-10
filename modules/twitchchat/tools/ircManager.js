const ircClient = require('node-irc');
const { osu_irc_args } = require('../../../config');
const [ server, port, username, password ] = osu_irc_args;

/*client.on('PRIVMSG', (args) => {
    console.log('privmsg:' , args)
});*/


this.client = null;

module.exports = {
    init_osu_irc: () => {
        this.client = new ircClient(server, port, username, username, password);
        this.client.verbosity = 0;
        this.client.connect();

    },

    irc_say: (username, text)=> {
        this.client.say(username, text);
    }
}
