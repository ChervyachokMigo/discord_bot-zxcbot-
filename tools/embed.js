
const { LogString } = require("./log.js")

const createEmbed = (color, title, desc, url, fields, image) => ({
    embeds: [
      {
        color,
        title,
        description: desc,
        url: url || undefined,
        fields,
        image: image ? image.url ? image : undefined : undefined
      }
    ]
  });
  
  module.exports = {
    NotificationEmbed: (title, desc, url = "", fields = [], msgContent = " ", image = { url: "" }) =>
      createEmbed("#ffff00", title, desc, url, fields, image),
    ErrorEmbed: (title, desc, url = "", fields = []) => 
      createEmbed("#ff0000", title, desc, url, fields),
    MessageSendBotChannel: async (channel, msg) => {
      if (!channel) return LogString("", "error", "send to channel", "channel does not exist");
      return channel.send(msg);
    },
    SendAnswer: async ({ channel, guildname, messagetype = "Error", title, text = "", fields = [], mentionuser = " ", image = "", url = "" }) => {
      if (!channel) return LogString(guildname, "error", title, "channel not specified");
      if (!guildname) return LogString("System", "error", "SendAnswer Error", "guild name not specified");
      if (!title) return LogString("System", "error", "SendAnswer Error", "message title not specified");
  
      text = text.slice(0, 4096) || " ";
      title = title.slice(0, 256) || " ";
  
      let messageData;
      switch (messagetype) {
        case "info":
          messageData = module.exports.NotificationEmbed(title, text, url, fields, mentionuser, { url: image });
          break;
        case "chat":
          messageData = text;
          break;
        default:
          messageData = module.exports.ErrorEmbed(title, text, url, fields, mentionuser);
      }
  
      try {
        return await module.exports.MessageSendBotChannel(channel, messageData);
      } catch (e) {
        console.error(e);
      }
    },
    SendError: async (message, com, text) => {
      await module.exports.SendAnswer({
        channel: message.channel,
        guildname: message.guild.name,
        messagetype: "Error",
        title: com.name,
        text: `${text}\n\nCommand: ${com.help}`,
        mentionuser: message.author
      });
    }
  };