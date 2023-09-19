const fs = require(`fs`);

const { SMTPServer } = require("smtp-server");
const { MailParser } = require('mailparser');

const { getFullTimeString } = require('../tools.js');

var server;
const SMTP_PORT = 25;
const mailsdbFolder = `mail_db`;

const smtp_options = {
  secure: false,
  authOptional: true,
  allowInsecureAuth: true,
  //authMethods: ['PLAIN'],
  /*onAuth: function(auth, session, callback) {
    if(auth.username !== 'testuser' || auth.password !== 'testpass') {
        return callback(new Error('Invalid username or password'));
    }
    callback(null, {user: 'testuser'}); //where 123 is the user id or similar property
  },*/
  onConnect: function(session, callback) {
      //console.log("onConnect : " + session.remoteAddress);
      //console.log("session : " + session.clientHostname);
      //console.log('session.hostNameAppearsAs : ' + session.hostNameAppearsAs);
      return callback(); //Accept the connection
  },
  onMailFrom: function(address, session, callback) {
      //console.log('onMailFrom : ' + address.address);
      return callback(); //Accept the address
  },
  onRcptTo: function(address, session, callback) {
      //console.log('onRcptTo : ' + address.address);
      return callback();//Accept the address
  },
  onData: function(stream, session, callback) {
    const parser = new MailParser();

    //console.log(session.envelope.rcptTo)

    var username = '';
    var subject = '';
    var sender = '';
    
    var postname = `${getFullTimeString(new Date())}`;

    parser.on('headers', headers => {
      username = headers.get('to').value.shift().address.split(`@`)[0]; 
      subject = headers.get('subject');
      sender = headers.get('from').value.shift().address;
    });

    parser.on('data', data => {

      if (data.type === 'text') {
        if (username.length>0){

          try{
            fs.mkdirSync(`${mailsdbFolder}/${username}`);
          } catch (e){
            if (e.code !== `EEXIST`){
                console.log(e);
                throw new Error(e);
            }
          }
          
          const posttext = `From: ${sender}\nSubject: ${subject}\n${data.text}`;

          console.log(`[${postname}] new message ${posttext}`);
          fs.writeFileSync(`${mailsdbFolder}/${username}/${postname}.txt`, posttext, {encoding:`utf-8`});
        }
      }
    });

    stream.pipe(parser); // print message to console

    stream.on("end", callback);
  },
}

module.exports = {
  init: () => {
    try{
      fs.mkdirSync(mailsdbFolder);
    } catch (e){
      if (e.code !== `EEXIST`){
          console.log(e);
          throw new Error(e);
      }
    }

    server = new SMTPServer(smtp_options);

    server.on("error", err => {
      console.log("Error %s", err.message);
    });
    
    server.listen(SMTP_PORT, ()=>{
      console.log("Server smtp started");
    });
  }
}