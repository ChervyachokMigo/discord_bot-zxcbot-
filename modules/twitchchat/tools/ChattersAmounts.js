const { SortObjectByValues } = require("../../tools.js");

var Chatters = [];

function clearChatters(channel){
    Chatters[channel] = {};
    Chatters[channel].TotalMessages = 0;
    Chatters[channel].Users = {};
}

function setDefaults (channel){
    if (typeof Chatters[channel] ==='undefined'){
        Chatters[channel] = {};
    }
    if (typeof Chatters[channel].TotalMessages ==='undefined'){
        Chatters[channel].TotalMessages = 0;
    }
    if (typeof Chatters[channel].Users ==='undefined'){
        Chatters[channel].Users = {};
    }
}

function addMessageAmount(channel, username){
    setDefaults(channel);

    if(typeof Chatters[channel].Users[username] === 'undefined'){
        Chatters[channel].Users[username] = 0;
    }

    Chatters[channel].Users[username]++;
    Chatters[channel].TotalMessages++;
}

function getChatters(channel){
    setDefaults(channel);
    
    Chatters[channel].Users = SortObjectByValues(Chatters[channel].Users, false);
    console.log(Chatters[channel])
    return Chatters[channel];
}

module.exports = {
    getChatters: getChatters,
    clearChatters: clearChatters,
    addMessageAmount: addMessageAmount
}