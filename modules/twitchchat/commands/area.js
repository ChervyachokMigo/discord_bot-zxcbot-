const fs = require("fs");
const { CHANNEL } = require("../constants/enumPermissions");

module.exports = {
    command_name: `tablet area`,
    command_description: `Информация о планшете`,
    command_aliases: [`area`, `tablet`],
    command_help: `tablet area`,
    command_permission: CHANNEL,
    action: async ({channelname, tags, comargs})=>{
        const settings_json = fs.readFileSync(`${process.env.LOCALAPPDATA}\\OpenTabletDriver\\settings.json`);
        return  {success: formatArea(settings_json)};
    }
}

const formatArea = (settings_json) => {
    const s = JSON.parse(settings_json);
    const Profile = s.Profiles.shift();
    const tabletName = Profile.Tablet;
    const info = Profile.AbsoluteModeSettings.Tablet;
    return [
        tabletName,
        `X: ${info.X.toFixed(1)}`,
        `Y: ${info.Y.toFixed(1)}`,
        `W: ${info.Width.toFixed(1)}`,
        `H: ${info.Height.toFixed(1)}`,
        `R: ${info.Rotation.toFixed(1)}`,
        `A: ${(info.Width/info.Height).toFixed(3)}`,
    ].join(' | ');
}