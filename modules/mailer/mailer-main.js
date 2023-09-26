const fs = require(`fs`);
const {EventEmitter} = require('events');

const { SMTPServer } = require("smtp-server");
const { MailParser } = require('mailparser');

const { getFullTimeString } = require('../tools.js');

const { SMTP_PORT } = require('../../config.js');

var server;

const mailsdbFolder = `data/mail_db`;

const ignore_list = [
  'jcom.home.ne.jp',
  'tiscali.it',
  'centrefile7@gmail.com'
];

const email = /(?:(?![a-zA-Z0-9_]{1}[a-zA-Z0-9_.-]*[a-zA-Z0-9_-]*).)/gi

const mailerEvents = new EventEmitter({captureRejections: true});

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
    for (const sendTo of session.envelope.rcptTo.map( u => u.address.split('@').shift())){

      const parser = new MailParser();

      var subject = '';
      const sender = session.envelope.mailFrom? session.envelope.mailFrom.address: 'Anonymous';
      
      if ( ignore_list.findIndex( from => from.includes(sender)) > -1 ){
        console.log( 'skip', sender, ' cause in ignore list');
        return;
      }

      const date_value = new Date();
      const postname = `${getFullTimeString(date_value)}`;


      const escaped_addressee = sendTo.replace(email, '').slice(0,100);
      const post_filepath = `${mailsdbFolder}/${escaped_addressee}/${postname}`;

      parser.on('headers', headers => {
        subject = headers.get('subject');
      });

      parser.on('data', data => {

        if (data.type === 'text') {

          if (escaped_addressee.length == 0) {
            return;
          }

          try{
            fs.mkdirSync(`${mailsdbFolder}/${escaped_addressee}`);
          } catch (e){
            if (e.code !== `EEXIST`){
                console.log(e);
                throw new Error(e);
            }
          }
          
          const posttext = `From: ${sender}\nSubject: ${subject}\n${data.textAsHtml || data.text || data.html || 'null'}`;

          const post_extname = '.html';

          console.log(`[${postname}] new message from: ${sender}\nSubject: ${subject}`);

          fs.writeFileSync(`${post_filepath}${post_extname}`, posttext, {encoding:`utf-8`});

          mailerEvents.emit('new_message', 
          { date: {postname, value: date_value }, 
            link: `${escaped_addressee}/${postname}${post_extname}`,
            filepath: `${post_filepath}${post_extname}`, 
            subject, sender, sendTo: escaped_addressee, data});
          
        }
      });
      stream.pipe(parser);
      stream.on("end", callback);

    }

  },
}

module.exports = {
  mailerEvents: mailerEvents,

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

    return mailerEvents;
  }
}