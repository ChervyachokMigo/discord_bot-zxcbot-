const path = require("path");
const md5File = require('md5-file');
const fs = require("fs");


const osu_songs = 'D:\\osu!\\Songs';
const destination = 'D:\\osu_md5_stock'
let processed = [];

const scan_osu = () => {
    console.log('scaning dirs..');

    const dirs = fs.readdirSync(osu_songs, { withFileTypes: true });
    let i = 0;
    for (const dir of dirs){
        console.log(i,'/', dirs.length);
        if (dir.isDirectory()){

            const files = fs.readdirSync( path.join(osu_songs, dir.name), { withFileTypes: true });

            for (const file of files){
                const filepath = path.join(osu_songs, dir.name, file.name);

                if (file.isFile() && path.extname( filepath ) === '.osu'){
                    const md5 = md5File.sync(filepath);
                    const relative_filepath = path.resolve(osu_songs, filepath);
                    processed.push({md5, filepath: relative_filepath});
                    fs.copyFileSync(filepath, path.join(destination, `${md5}.osu`));
                }
            }
        }
        i++;
    }
    fs.writeFileSync('processed_md5.json',JSON.stringify(processed), {encoding: 'utf8'});
}

scan_osu();