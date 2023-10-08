module.exports = {
    formatCommandText: ({channelname, username, command}) => {
        return `[https://www.twitch.tv/${channelname}] ${username} > ${command}`;
    },

    /*how to use: channelname === 'talalusha'? 
    boldSelectedWords(TalalaToBoldRegexp, message)*/

    boldSelectedWords: (regexp, str) => {
        let messages = str.split(' ');
        messages.map((val,idx,arr)=>{
            if (!val.startsWith('http')){
                arr[idx] = val.replace(regexp, (val)=>{ return `**${val}**` });
            }
        }) 
        messages = messages.join(' ');
        return messages;
    }
}