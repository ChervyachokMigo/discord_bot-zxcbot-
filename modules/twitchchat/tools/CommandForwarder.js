const { stalkerChatRefreshRate } = require("../../../settings");
const { setInfinityTimerLoop } = require("../../tools");

const { emit } = require("./GuildEvents");
const { formatCommandText } = require("./general");


this.timer = null;

this.commands = [];

const sendLastCommands = async () => {
    if (this.commands.length > 0){
        const text = this.commands.map( val => formatCommandText(val)).join(`\n`);
        emit('lastCommands', {text});
        this.commands = [];
    }
}

module.exports = {
    initCommandsForwarderTimer: () => {
        clearInterval(this.timer);
        this.timer = setInfinityTimerLoop(sendLastCommands, stalkerChatRefreshRate);
    },

    sendLastCommands: sendLastCommands,

    saveLastCommand: ({command, channelname, username}) => {
        this.commands.push({command, channelname, username});
    }
}