const fs = require('fs');
const axios = require('axios');

const { CreateFolderSync_IsNotExists } = require('../tools.js');

module.exports = async function (file, user){
    var localTempOfUser = `data_osuReplays/${user.id}/temp/`;
    try{
        return new Promise(async (resolveFilename,  rejectError)=>{
            try{
                if (CreateFolderSync_IsNotExists(localTempOfUser)){

                    let filename_local = localTempOfUser + file.name;

                    await downloadFile(file, filename_local);

                    let fd = fs.openSync(filename_local,'r');
                    let stats = fs.fstatSync(fd);
                    fs.closeSync(fd);

                    if (file.size === stats.size){
                        resolveFilename(filename_local);
                    } else {
                        console.log('Размер скачанного не совпадает с исходным')
                        resolveFilename(undefined);
                    }         
                }
            } catch (e){
                console.log(e);
                resolveFilename(undefined);
            }
        });
    } catch (e){
        console.log(e)
        return undefined;
    }
}

async function downloadFile(file, outputPath) {
    var headers = { headers :{ 
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/x-www-form-urlencoded' ,
        'Accept': 'application/x-osu-replay',
    }};
    await axios.get(
        file.url, 
        { method: "get", 
          responseType: 'arraybuffer', 
          responseEncoding: 'binary'}, 
        headers )
        .then(response => {
        fs.writeFileSync(outputPath, Buffer.from(response.data, {encoding: 'binary'}), {encoding: 'binary'});
    }).catch(err=>{
        console.log(err)
    });
}