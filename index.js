const express = require('express');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk');

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use( (req, res, next) => {  
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
 }); 

app.use('/', express.static(__dirname + '/'));
app.get('/', function (req, res) {
    res.sendfile(__dirname + 'index.html');
});

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'EBWKjlELKMYqRNQ6sYvFo64FtaRLRR5BdHEESmha49TM',
    'client_secret': 'EO422dn3gQLgDbuwqTjzrFgFtaRLRR5BdHEESmha49TM',
    'headers' : {
    'custom': 'header'
    }
});

let paymentPayPal = {
  "intent": "sale",
  "payer": {
    "payment_method": "paypal"
  },
  "redirect_urls": {
    "return_url": "http://localhost:8070/success",
    "cancel_url": "http://localhost:8070/success"
  },
  "transactions": [{
    "amount": {
      "total": "5.00",
      "currency": "USD"
    },
    "description": "My awesome payment"
  }]
};


const cardType = getCardType(5500005555555559)

let paymentCard = {
  "intent": "sale",
  "payer": {
    "payment_method": "credit_card",
    "funding_instruments": [{
      "credit_card": {
        "number": "5500005555555559",
        "type": cardType,
        "expire_month": 12,
        "expire_year": 2018,
        "cvv2": 111,
        "first_name": "Joe",
        "last_name": "Shopper"
      }
    }]
  },
  "transactions": [{
    "amount": {
      "total": "5.00",
      "currency": "USD"
    },
    "description": "My awesome payment"
  }]
};

payment = JSON.stringify(payment);

app.post('/paypal', function (req, res){
  paypal.payment.create(paymentPayPal, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      //console.log(payment);
      if(payment.payer.payment_method === 'paypal') {
        let redirectUrl;
        payment.links.forEach(el => {
          console.log(el)
          if (el.method === 'REDIRECT') {
            redirectUrl = el.href;
          }
        });
        res.redirect(redirectUrl);
      }
    }
  });
});

app.post('/card', function (req, res){
  paypal.payment.create(paymentCard, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      console.log(payment);
      res.redirect('http://localhost:8070/');
    }
  });
});

app.get('/success',  function (req, res) {
  const paymentId = req.query.paymentId;
  const payerId = req.query.PayerID;

  const details = { "payer_id": payerId };
  const payment = paypal.payment.execute(paymentId, details, function (error, payment) {
    if (error) {
      console.log(error);
      res.redirect('http://localhost:8070/error');
    } else {
      console.log(payment)
      res.redirect('http://localhost:8070/');
    }
  });
})

app.listen(8070);
console.log('Express server listening on port 8070');

function getCardType (number) {
  number = number + '';
  if (number.match(/^4/)) {
    return 'visa';
  } else if (number.match(/^5[1-5]/)) {
    return 'mastercard';
  } else if (number.match(/^3[47]/)) {
    return 'american-express';
  } else if (number.match(/^6(?:011|5)/)) {
    return 'discover';
  } else if (number.match(/^(?:2131|1800|35)/)) {
    return 'jcb';
  } else if (number.match(/^3(?:0[0-5]|[68])/)) {
    return 'diners-club';
  } else if (number.match(/^5018|5020|5038|5893|6304|67(59|61|62|63)|0604/)) {
    return 'maestro';
  } else {
    return '';
  }
}