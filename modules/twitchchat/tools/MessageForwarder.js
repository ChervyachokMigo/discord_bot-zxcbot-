const { setInfinityTimerLoop } = require("../../tools");
const { emit } = require("./GuildEvents");

const { stalkerChatRefreshRate } = require("../../../settings");
const { ModerationName } = require("../constants/general");
const max_discord_message_length = 2000;

this.MessagesBuffer = [];
this.send_message_timer = null;

const sendMessages = () => {
    if (this.MessagesBuffer.length > 0){
        for (const messages of this.MessagesBuffer){
            
            if (messages.channelname === ModerationName){
                const text = messages.texts.join(`\n`);
                emit('newChatMessage', {channelname: messages.channelname, text});
            }

        }

        this.MessagesBuffer = [];
    }
}

const sendIfLongLength = (next_message) => {
    if ( (getLength() + next_message.length) >= max_discord_message_length){
        sendMessages();
    };
}

const getLength = () => {
    return this.MessagesBuffer.length === 0? 0 :
        this.MessagesBuffer.map( (messages) => 
            messages.texts.map( text => text.length)
            .reduce( (a, b) => a + b) 
        ).reduce( (a,b) => a + b );
}

module.exports = {
    initMessageForwarderTimer: () => {
        clearInterval(this.send_message_timer);
        this.send_message_timer = setInfinityTimerLoop(sendMessages, stalkerChatRefreshRate);
    },

    sendMessages: sendMessages,
    sendIfLongLength: sendIfLongLength,
    
    saveMessageInBuffer: (channelname, message_formated) =>{
        //channel index in buffer
        const i =  this.MessagesBuffer.findIndex( val => val.channelname === channelname );

        //is not exists
        if (i == -1){
            this.MessagesBuffer.push({
                channelname: channelname, 
                texts: [message_formated]
            });
        } else {
            this.MessagesBuffer[i].texts.push(
                message_formated
            );
        }
    },


}