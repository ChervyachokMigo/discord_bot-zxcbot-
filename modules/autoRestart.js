const { isProcessing } = require (`../modules/stalker/records.js`);
const ps = require("child_process");

module.exports = async function (){
   /* if (isProcessing() == false){
        console.log("Ready.")
        process.once("exit", function () {
            exit();
        });
        process.once("SIGINT", function () {
            exit();
        });

        process.on('SIGUSR1',  function () {
            exit();
        });
        process.on('SIGUSR2',  function () {
            exit();
        });
        
        //process.exit();
    }*/
}

function exit(){
    ps.execSync(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached : true,
        stdio: "inherit"
    });
    process.exit();
}