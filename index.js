// Express server
const express = require('express');
const app = express();
const request = require('request');
const bodyParser = require('body-parser');

// Pino logger
const pino = require('pino');
const expressPino = require('express-pino-logger');

// Twilio messaging
const twilioAccountSid = process.env.SID;
const twilioAuthToken = process.env.KEY;
const twilioFrom = process.env.FROM_NUMBER;
const twilioTo = process.env.TO_NUMBER;

const Twilio = require('twilio')(twilioAccountSid, twilioAuthToken);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

  // Message Formatting: 
  // `
  //   *bold*
  //   _italic_
  //   ~strikethrough~
  // \`\`\`//code snippet
  // fire.startedBy != we;
  // fire.burningSince = worldTurning.StartDate;
  // \`\`\`
  // `

  // Permitted messages in sandbox mode
  //
  // Your {{1}} code is {{2}}
  // Your appointment is coming up on {{1}} at {{2}}
  // Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// Pino logger settings to work with repl.it console
const logger = pino({ 
  level: process.env.LOG_LEVEL || 'info',
  redact: ['res.headers', 'req.headers'],
  prettyPrint: {
    levelFirst: true,
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'SYS:HH:MM:ss.l'
  }
});
const expressLogger = expressPino({ 
  logger,
  useLevel: 'debug'
});


// Set up express server
app.use(expressLogger);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));


/*
  
*/
app.post('/message', (req, res) => {
  // Log some things to help with development
  req.log.debug('incoming message', req.method, req.url);
  logger.info(req.body, `${req.body.From}: ${req.body.Body}`);

  // Echo message back to WhatsApp user.
  const response = new MessagingResponse();
  response.message(`*Received* ✅
  Your message: _${req.body.Body}_
`);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(response.toString());
});


app.post('/status', (req, res) => {
  /*
    SmsSid: "SM3f5969f6780e2359f7b6cdd3469823b6"
    SmsStatus: "sent"
    MessageStatus: "sent"
    ChannelToAddress: "+447974242705"
    To: "whatsapp:+447974242705"
    ChannelPrefix: "whatsapp"
    MessageSid: "SM3f5969f6780e2359f7b6cdd3469823b6"
    AccountSid: "ACd25f8a5085f1454711a3f86c2dfdb318"
    StructuredMessage: "false"
    From: "whatsapp:+14155238886"
    ApiVersion: "2010-04-01"
    ChannelInstallSid: "XEcc20d939f803ee381f2442185d0d5dc5"
  */

  logger.info(req.body.To, req.body.MessageStatus, req.body.MessageSid, req.body.ErrorCode);
});



var listener = app.listen(process.env.PORT, function() {
  logger.info('Your app is listening on port ' + listener.address().port);

  sendAppStartMessage();
});


function sendAppStartMessage() {
  // Your {{1}} code is {{2}}
  const message = "Your status code is App Started. Reply to activate the chatbot.";

  Twilio.messages
        .create({
          from: twilioFrom,
          body: message,
          to: twilioTo
        })
        .then(message => console.log(message.sid));
}