const { Service } = require('node-windows');

// Create a new service object
const svc = new Service({
    name:'node_discord_bot',
    description: 'node_discord_bot',
    script: 'F:\\node_js_stuff\\node_projects\\a_discord_bot\\main.js',
    //, workingDirectory: '...'
    //, allowServiceLogon: true
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
    console.log('service installed');
    svc.start();
});

svc.on('alreadyinstalled', (e) => {
    console.log('service already installed');
    console.error(e);
});

svc.on('error', (e) => {
    console.error(e);
});

svc.on('uninstall',function(){
    console.log('service uninstalled');
});

svc.uninstall();
svc.install();
