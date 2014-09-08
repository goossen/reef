var nodemailer = require('nodemailer');

var config = require('./config.json');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.emailUser,
        pass: config.emailPassword
    }
});

function _email(messageBody) {

   // setup e-mail data with unicode symbols
   var mailOptions = {
      from: 'pi <' + config.emailUser + '>', // sender address
      to: config.emailUser, // list of receivers
      subject: 'Aquarium status ✔', // Subject line
      text: messageBody, // plaintext body
      html: messageBody // html body
   };

   // send mail with defined transport object
   transporter.sendMail(mailOptions, function(error, info){
      if(error){
         console.log(error);
      }else{
         console.log('Message sent: ' + info.response);
      }
   });
}

exports.email = _email;



