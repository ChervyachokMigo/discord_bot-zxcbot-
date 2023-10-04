const fs = require(`fs`);

const { SMTPServer } = require("smtp-server");
const { MailParser } = require('mailparser');

const { SMTP_PORT } = require('../../config.js');

const { mailRegex, mail_addressee_max_length, mail_db_key_length } = require('../webserver/subdomains/api_consts/api_settings.js')

const { save_mail_content, load_ignore_emails } = require('../webserver/subdomains/api_modules/api_store_mail.js')
const { generate_token } = require('../webserver/subdomains/api_modules/api_store_general.js');

var server;

const { emit } = require('./mailer-events.js');


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

      const escaped_addressee = sendTo.replace(mailRegex, '').slice(0, mail_addressee_max_length);
      const sender = session.envelope.mailFrom? session.envelope.mailFrom.address: 'Anonymous';

      const date_value = new Date();

      var subject = '';
      parser.on('headers', headers => {
        subject = headers.get('subject');
      });

      parser.on('data', async (data) => {

        if ((await load_ignore_emails()).findIndex ( from => sender.includes(from)) > -1) {
          console.log( 'skip', sender, ' cause in ignore list');
          return;
        }
        
        if (data.type === 'text') {

          if (escaped_addressee.length == 0) {
            return;
          }

          console.log(`new email \nto: ${escaped_addressee} \nfrom: ${sender}\nSubject: ${subject}`);

          const unique_key = generate_token(mail_db_key_length);

          await save_mail_content({
            unique_key ,
            addressee: escaped_addressee,
            from: sender,
            subject: subject,
            html: data.html,
            textAsHtml: data.textAsHtml,
            text: data.text,
            date: date_value
          });

          emit('new_message', { 
            date: { value: date_value }, 
            link: `?action=new_message&addressee=${escaped_addressee}&post_key=${unique_key}`,
            subject, sender, sendTo: escaped_addressee, data
          });
        }
      });
      stream.pipe(parser);
      stream.on("end", callback);

    }

  },
}

module.exports = {

  init: async () => {
    server = new SMTPServer(smtp_options);

    server.on("error", err => {
      console.log("Error %s", err.message);
    });
    
    server.listen(SMTP_PORT, ()=>{
      console.log("Server smtp started");
    });
  }
}