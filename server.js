var express = require('express');
const http = require('http');
const https = require('https');
var request = require('request');
const path = require('path');
const config = require('config');
var bodyParser = require('body-parser');
var canvasToBlob = require('blob-util');
var cors = require('cors');
const Blob = require('blob');
var FormData = require('form-data');
var app = express();
var multer = require('multer');
const axios = require('axios').default;

var corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: true,
  optionsSuccessStatus: 204,
};
app.use(cors());
// //app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Parse URL-encoded bodies (as sent by HTML forms)
// app.use(express.urlencoded());
// app.use(express.json());
// app.use(express.bodyParser());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

//var agent = new http.Agent({ family: 4 });
//axios.defaults.httpAgent = agent;
const fxguardConfig = config.get('fxguard');

//console.log(fxguardConfig);
const port = process.env.PORT || 80;

app.listen(port, () => console.log(`Listening on port ${port}`));

// Serve any static files built by React
app.use(express.static(path.join(__dirname, 'client/build')));

// console.log('Proces - ', process.env);
const BASE_URL = process.env.JAVA_API
    ? process.env.JAVA_API
    : fxguardConfig['base-url'];
// const BASE_URL = 'https://devapi.fxguard.co.uk';
console.log('BASE URL - ', BASE_URL);

app.get('/', cors(), function (req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

let options = {
  headers: {
    //"content-type": "multipart/form-data" ,
    'content-type': 'application/x-www-form-urlencoded',
    Authorization: 'Basic ' + fxguardConfig.auth,
  },
};

app.get('/url', cors(), (req, res, next) => {
  res.json(['Tony', 'Lisa', 'Michael', 'Ginger', 'Food']);
});
app.get("/cms/url-link", cors(), (req, res, next) => {
  res.json({hide_transaction: process.env.HIDE_TRANSACTION_MODULE ? process.env.HIDE_TRANSACTION_MODULE : fxguardConfig["HIDE_TRANSACTION_MODULE"]});
});
// var liveMarketRates = require("./json/exchangeRate-live.json");

// const getRandom = (min, max) => {
//   return Math.random() * (max - min) + min;
// };
// app.get('/fx-forrex/exchangeRate/live', (req, res, next) => {
//   console.log('INTERNAL GET - ' + '/fx-forrex/exchangeRate/live');
//   let exchangeRates = liveMarketRates.exchangeRates.map(currency => {
//     return {
//       ask: (currency.ask + getRandom(-10, 10)*currency.ask/100).toFixed(5),
//       mid: (currency.mid + getRandom(-10, 10)*currency.mid/100).toFixed(5),
//       bid: (currency.bid + getRandom(-10, 10)*currency.bid/100).toFixed(5),
//       currencyPair: currency.currencyPair,
//       quoteCurrency: currency.quoteCurrency,
//       baseCurrency: currency.baseCurrency
//     }
//   });
//   res.json({date: liveMarketRates.date, endpoint: liveMarketRates.endpoint, exchangeRates: exchangeRates});
// });

const getCall = (url, queryParam, req, res, next) => {
  console.log('GET - ' + url);
  let authHeader = {};
  if (req.headers.access_token) {
    authHeader = { Authorization: 'Bearer ' + req.headers.access_token };
  } else if (req.headers.authorization) {
    authHeader = { Authorization: req.headers.authorization };
  }
  const config = {
    headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        ...authHeader,
    },
    // params: req.query ? req.query : null,
};
axios
    .get(url, config)
    .then((response) => {
        // console.log('DATA - ', response.data);
        res.json(response.data);
    })
    .catch((e) => {
        if (e.response) {
            console.log('ERROR STATUS - ', e.response.status);
            console.log('ERROR DATA - ', e.response.data);
            const data = {
              errorCode: e.response.status,
              errorDesc: e.response.data && e.response.data.errorDesc ? e.response.data.errorDesc : 'Bad Request',
              userDesc: e.response.data && e.response.data.userDesc ? e.response.data.userDesc : 'Unauthorized',
        };
            res.json(data);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error - ', e.message);
            res.json({
                errorCode: 400,
                errorDesc: 'Bad Request',
                userDesc: 'Unknown Error from Server',
            });
        }
    });
  // request.get(
  //   {
  //     headers: {
  //       'content-type': 'application/json',
  //       'HOST': 'https://devui.fxguard.co.uk',
  //       ...authHeader,
  //       ...req.headers,
  //     },
  //     qs: req.query ? req.query : null,
  //     url: url,
  //   },
  //   (error, response, body) => {
  //     if (error) {
  //       console.log(error);
  //       return next(error);
  //     }
  //     try {
  //       res.json(JSON.parse(body));
  //     } catch (e) {
  //       res.json(e);
  //     }
  //   }
  // );
};

const postCall = (url, req, res, next) => {
  console.log('POST - ' + url);

  let authHeader = {};
  if (req.headers.authorization) {
      authHeader = { Authorization: req.headers.authorization };
  }
  const config = {
      headers: {
          Accept: 'application/json',
          'content-type': 'application/json',
          ...authHeader,
      },
  };
  axios
      .post(url, req.body, config)
      .then((response) => {
          // console.log('RESPONSE - ', response.data);
          res.json(response.data);
      })
      .catch((e) => {
          if (e.response) {
              // Request made and server responded
              console.log('Data - ', e.response.data);
              console.log('Status - ', e.response.status);
              console.log('Headers - ', e.response.headers);
              res.json({
                errorCode: e.response.status,
                errorDesc: e.response.data && e.response.data.errorDesc ? e.response.data.errorDesc : 'Bad Request',
                userDesc: e.response.data && e.response.data.userDesc ? e.response.data.userDesc : 'Unauthorized',
            });
          } else {
              // Something happened in setting up the request that triggered an Error
              console.log('Error - ', e.message);
              res.json({
                  errorCode: 400,
                  errorDesc: 'Bad Request',
                  userDesc: 'Unknown Error from Server',
              });
          }
      });
};

const deleteCall = (url, req, res, next) => {
  console.log('DELETE - ' + url);

  let authHeader = {};
    if (req.headers.authorization) {
        authHeader = { Authorization: req.headers.authorization };
    }
    const config = {
        headers: {
            Accept: 'application/json',
            'content-type': 'application/json',
            ...authHeader,
        },
        params: req.query ? req.query : null,
        data: req.body,
    };
    axios
        .delete(url, config)
        .then((response) => {
            // console.log(response.data);
            res.json(response.data);
        })
        .catch((e) => {
            if (e.response) {
                // Request made and server responded
                // console.log('Data - ', e.response.data);
                // console.log('Status - ', e.response.status);
                // console.log('Headers - ', e.response.headers);
                res.json({
                  errorCode: e.response.status,
                  errorDesc: e.response.data && e.response.data.errorDesc ? e.response.data.errorDesc : 'Bad Request',
                  userDesc: e.response.data && e.response.data.userDesc ? e.response.data.userDesc : 'Unauthorized',
                });
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error - ', e.message);
                res.json({
                    errorCode: 400,
                    errorDesc: 'Bad Request',
                    userDesc: 'Unknown Error from Server',
                });
            }
        });

  // request.delete(
  //   {
  //     headers: {
  //       Accept: 'application/json',
  //       'content-type': 'application/json',
  //       'HOST': 'https://devui.fxguard.co.uk',
  //       ...req.headers,
  //     },
  //     url: url,
  //     qs: req.query ? req.query : null,
  //     body: req.body ? JSON.stringify(req.body) : null,
  //   },
  //   (error, response, body) => {
  //     if (error) {
  //       console.log('ERROR - ', error);
  //       return next(error);
  //     }
  //     try {
  //       res.json(JSON.parse(body));
  //     } catch (e) {
  //       res.json(e);
  //     }
  //   }
  // );
};

const putCall = (url, req, res, next) => {
  console.log('PUT - ' + url);
  let authHeader = {};
    if (req.headers.authorization) {
        authHeader = { Authorization: req.headers.authorization };
    }
    const config = {
        headers: {
            Accept: 'application/json',
            'content-type': 'application/json',
            ...authHeader,
        },
        params: req.query ? req.query : null,
    };
    axios
        .put(url, req.body, config)
        .then((response) => {
            // console.log(response.data);
            res.json(response.data);
        })
        .catch((e) => {
            if (e.response) {
                // Request made and server responded
                // console.log('Data - ', e.response.data);
                // console.log('Status - ', e.response.status);
                // console.log('Headers - ', e.response.headers);
                res.json({
                  errorCode: e.response.status,
                  errorDesc: e.response.data && e.response.data.errorDesc ? e.response.data.errorDesc : 'Bad Request',
                  userDesc: e.response.data && e.response.data.userDesc ? e.response.data.userDesc : 'Unauthorized',
                });
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error - ', e.message);
                res.json({
                    errorCode: 400,
                    errorDesc: 'Bad Request',
                    userDesc: 'Unknown Error from Server',
                });
            }
        });
        
//   request.put(
//     {
//       headers: {
//         Accept: 'application/json',
//         'content-type': 'application/json',
//         'HOST': 'https://devui.fxguard.co.uk',
//         ...req.headers,
//       },
//       url: url,
//       body: req.body ? JSON.stringify(req.body) : null,
//     },
//     (error, response, body) => {
//       if (error) {
//         console.log('ERROR - ', error);
//         return next(error);
//       }
//       try {
//         res.json(JSON.parse(body));
//       } catch (e) {
//         res.json(e);
//       }
//     }
//   );
};

/************ CMS Route ************/

app.get('/cms/public/pdfs/:path([a-z/-_\\.]+)', (req, res) => {
  https.get(fxguardConfig['cms'] + '/public/pdfs/' + req.params.path, function (resp) {
    resp.pipe(res);
  });
});
app.get('/cms/public/images/:path([a-z/-_\\.]+)', (req, res) => {
  https.get(fxguardConfig['cms'] + '/public/images/' + req.params.path, function (resp) {
    resp.pipe(res);
  });
});
app.get('/cms/:path([a-z/-_\\.]+)', (req, res, next) => {
  const url = fxguardConfig['cms'] + '/' + req.params.path;
  console.log('GET - ' + url);
  request.get(
    {
      url: url,
    },
    (error, response, body) => {
      if (error) {
        console.log(error);
        return next(error);
      }
      // console.log('BODY - ', body);
      // console.log('ISSUE - ', JSON.parse(body));
      try {
        res.json(JSON.parse(body));
      } catch (e) {
        console.log(e);
      }
    }
  );
});

/***********************************/

app.delete('/fx-auth-server/:path([A-Z0-9+.@/-]+)', (req, res, next) => {
  deleteCall(BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path, req, res, next);
});

app.get('/fx-auth-server/:path([a-z0-9/-]+)', (req, res, next) => {
  // getCall(BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path, req.query, req, res, next);
  getCall(BASE_URL + req.originalUrl, null, req, res, next);
});

app.put('/fx-auth-server/:path([A-Z0-9+.@/-]+)', (req, res, next) => {
  putCall(BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path, req, res, next);
});

app.post('/fx-auth-server/admin/register', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-auth-server'] + '/admin/register', req, res, next);
});

app.post('/fx-auth-server/:path([a-z/-]+)', (req, res, next) => {
  console.log('POST PATH - ', BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path);
  let authOptions = { ...options };
  let formData = { ...req.body };

  if (req.body.grant_type === 'refresh_token') {
    authOptions = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + fxguardConfig['auth'],
      },
    };
  }

  let op = {
    ...authOptions,
    url: BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path,
  };

  if (req.body.grant_type === 'refresh_token') {
    op.form = formData;
  } else {
    op.formData = formData;
  }

  request.post(op, (error, response, body) => {
    if (error) {
      return console.dir(error);
    }
    // console.log(body);
    if (req.body.grant_type === 'mfa') {
      let bodyObj = JSON.parse(body);
      res.set('Authorization', bodyObj.access_token);
    }
    try {
      // console.log(body);
      res.json(JSON.parse(body));
    } catch (e) {
      console.log(e);
    }
  });
});
// This route is added for forgot password feature because previous one has multi-part
app.post('/fx-auth-server1/:path([a-z/-]+)', (req, res, next) => {
  console.log(BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path);
  console.log(JSON.stringify(req.body));
  request.post(
    {
      headers: {
        'content-type': 'application/json',
      },
      url: BASE_URL + fxguardConfig['fx-auth-server'] + '/' + req.params.path,
      body: JSON.stringify(req.body),
    },
    (error, response, body) => {
      //console.log("RESPONSE");
      //console.log(response);
      if (error) {
        console.log('ERROR - ', error);
        return console.dir(error);
      }

      try {
        console.dir(JSON.parse(body));
        res.json(JSON.parse(body));
      } catch (e) {
        res.json(e);
      }
    }
  );
});

app.post('/fx-crm/customer/register', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/customer/register', req, res, next);
});

app.post('/fx-crm/public/contactus', (req, res, next) => {
  // postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/contactus', req, res, next);
  console.log(req.params);
  console.log(BASE_URL + fxguardConfig['fx-crm'] + '/public/contactus');
  request.post(
    {
      headers: {
        //"content-type": "multipart/form-data" ,
        'content-type': 'application/json',
      },
      url: BASE_URL + fxguardConfig['fx-crm'] + '/public/contactus',
      body: JSON.stringify(req.body),
    },
    (error, response, body) => {
      if (error) {
        console.log('CONTACT US ' + JSON.parse(error));
        return console.dir(error);
      }
      try {
        console.log('CONTACT US ' + body);
        res.json(body);
      } catch (e) {
        console.log('CONTACT US ' + JSON.parse(e));
        res.json(e);
      }
    }
  );
});

var storage = multer.memoryStorage();
var upload = multer({ storage: storage }).single('file');

app.post('/fx-crm/public/uploadFile', (req, res, next) => {
  console.log(BASE_URL + fxguardConfig['fx-crm'] + '/public/upload');

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
      // A Multer error occurred when uploading.
    } else if (err) {
      return res.status(500).json(err);
      // An unknown error occurred when uploading.
    }

    let options = {
      url: BASE_URL + fxguardConfig['fx-crm'] + '/public/upload',
      method: 'POST',
      formData: {
        file: {
          value: req.file.buffer,
          options: {
            filename: req.file.originalname,
            contentType: req.file.mimeType,
          },
        },
      },
    };
    request(options, function (error, response, body) {
      if (error) {
        return console.dir(error);
      }
      try {
        console.log('uploadFile ' + body);
        res.json(body);
      } catch (e) {
        console.log('uploadFile ' + JSON.parse(e));
        res.json(e);
      }
    });
  });
});
app.post('/fx-crm/blog/upload', (req, res, next) => {
  console.log(BASE_URL + fxguardConfig['fx-crm'] + '/blog/upload');

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
      // A Multer error occurred when uploading.
    } else if (err) {
      return res.status(500).json(err);
      // An unknown error occurred when uploading.
    }
    console.log('FILE - ', req.file);
    let options = {
      url: BASE_URL + fxguardConfig['fx-crm'] + '/blog/upload',
      method: 'POST',
      headers: {
        Authorization : req.headers.authorization,

      },
      formData: {
        file: {
          value: req.file.buffer,
          options: {
            filename: req.file.originalname,
            contentType: req.file.mimeType,
          },
        },
      },
    };

// const image = fs.readFileSync('./sample2.html');
// const form = new FormData();
// form.append('file', image, 'sample2.html');

// // Send form data with axios
// const response = await axios.post(BASE_URL + fxguardConfig['fx-crm'] + '/blog/upload', form, {
//   headers: {
//     ...form.getHeaders(),
//     Authorization: req.headers.authorization,
//   },
// });
// console.log("resppppp.....", response);


    request(options, function (error, response, body) {
      if (error) {
        return console.dir(error);
      }
      try {
        console.log('Blog File ' + body);
        res.json(body);
      } catch (e) {
        console.log('Blog File ' + JSON.parse(e));
        res.json(e);
      }
    });
  });
});

app.post('/fx-crm/public/v1/verfication/sendOtp', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/v1/verfication/sendOtp/', req, res, next);
});
app.post('/fx-crm/customer/:path([a-z/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/customer/' + req.params.path, req, res, next);
});

app.get('/fx-crm/customer/:path([a-z/-]+)', (req, res, next) => {
  // getCall(BASE_URL + fxguardConfig['fx-crm'] + '/customer/' + req.params.path, req.query, req, res, next);
  getCall(BASE_URL + req.originalUrl, null, req, res, next);
});

app.post('/fx-crm/public/customer/user/:path([a-zA-Z0-9/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/customer/user/' + req.params.path, req, res, next);
});

app.post('/fx-crm/public/customer/:path([a-zA-Z0-9/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/customer/' + req.params.path, req, res, next);
});

app.post('/fx-crm/public/v1/:path([a-zA-Z0-9/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/v1/' + req.params.path, req, res, next);
});

// app.post('/fx-crm/public/:path([a-zA-Z0-9/-]+)', (req, res, next) => {
//   postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/' + req.params.path + '/' + req.body.email, req, res, next);
// });

app.post('/fx-crm/public/:path([a-z/-]+)', (req, res, next) => {
//   postCall(BASE_URL + fxguardConfig['fx-crm'] + '/public/' + req.params.path + '/' + req.body.email, req, res, next);
    console.log(req.params);
    console.log(fxguardConfig['base-url'] + fxguardConfig['fx-crm'] + '/public/' + req.params.path + '/' + req.body.email);
    request.post(
      {
        url: fxguardConfig['base-url'] + fxguardConfig['fx-crm'] + '/public/' + req.params.path + '/' + req.body.email,
      },
      (error, response, body) => {
        if (error) {
          console.log('KEEP ME UPDATED ' + JSON.parse(error));
          return console.dir(error);
        }
        try {
          res.json(body);
        } catch (e) {
          console.log('KEEP ME UPDATED ' + JSON.parse(e));
          res.json(e);
        }
      }
    );
});
app.get('/fx-crm/risk/:path([a-zA-Z0-9+-_.@/-]+)', (req, res, next) => {
  getCall(BASE_URL + req.originalUrl, null, req, res, next);
});
app.post('/fx-crm/admin/:path([a-z/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/admin/' + req.params.path, req, res, next);
});

app.post('/fx-crm/plan/:path([a-z/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/plan/' + req.params.path, req, res, next);
});

app.post('/fx-crm/:path([a-zA-Z0-9+.@/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-crm'] + '/' + req.params.path, req, res, next);
});
app.get('/fx-crm/:path([a-zA-Z0-9+.@/-]+)', (req, res, next) => {
  // getCall(BASE_URL + fxguardConfig['fx-crm'] + '/' + req.params.path, req.query, req, res, next);
  getCall(BASE_URL + req.originalUrl, null, req, res, next);
});

app.put('/fx-crm/:path([a-zA-Z0-9+.@/-]+)', (req, res, next) => {
  putCall(BASE_URL + fxguardConfig['fx-crm'] + '/' + req.params.path, req, res, next);
});

app.delete('/fx-crm/:path([A-Z0-9+.@/-]+)', (req, res, next) => {
  deleteCall(BASE_URL + fxguardConfig['fx-crm'] + '/' + req.params.path, req, res, next);
});

const getFeed = (url, req, res, next) => {
  let Parser = require('rss-parser');
  let parser = new Parser();
  
  const start = req.query.start ? req.query.start : 0;
  const size = req.query.size ? req.query.size : 20;
  parser.parseURL(url, (err, feed) => {
    if (err) {console.log('ERROR - ', err);return next(err);}
    feed.items.forEach(function(entry) {
      console.log(entry.title + ':' + entry.link);
    })
    try {
      let updatedFeed = feed;
      const isMore = (+start + +size) < feed.items.length;
      let items = feed.items;
      let endCount = +start + +size;
      let nitems = items.slice(start, endCount);
      updatedFeed.items = nitems;
      updatedFeed.isMore = isMore;
      res.json(updatedFeed);
    } catch (e) {
      console.log('EXCEPTION - ', e);
      next(e);
    }
  });
};

app.get('/fx-forrex/marketIntelligence', (req, res, next) => {
  if (req.query.type === 'CNBC') {
    getFeed('https://www.cnbc.com/id/10000664/device/rss/rss.html', req, res, next);
  } else if (req.query.type === 'INVESTING_1') {
    getFeed('https://uk.investing.com/rss/forex.rss', req, res, next);
  } else if (req.query.type === 'INVESTING_2') {
    getFeed('https://www.investing.com/rss/news_1.rss', req, res, next);
  } else if (req.query.type === 'INVESTING_3') {
    getFeed('https://www.investing.com/rss/news_14.rss', req, res, next);
  } else if (req.query.type === 'INVESTING_4') {
    getFeed('https://www.investing.com/rss/news_285.rss', req, res, next);
  } else if (req.query.type === 'INVESTING_5') {
    getFeed('https://www.investing.com/rss/forex_Technical.rss', req, res, next);
  } else if (req.query.type === 'FOREXLIVE') {
    getFeed('https://www.forexlive.com/feed', req, res, next);
  } else if (req.query.type === 'TRADING') {
    getFeed('https://api.tradingeconomics.com/news?c=guest:guest&f=json', req, res, next);
    // getFeed('https://tradingeconomics.com/rss/news.aspx', req, res, next);
  } else if (req.query.type === 'REUTERS_1') {
    getFeed('https://www.reutersagency.com/feed/?best-sectors=economy&post_type=best', req, res, next);
  } else if (req.query.type === 'REUTERS_2') {
    getFeed('https://www.reutersagency.com/feed/?best-sectors=foreign-exchange-fixed-income&post_type=best', req, res, next);
  } else if (req.query.type === 'REUTERS_3') {
    getFeed('https://www.reutersagency.com/feed/?best-sectors=equities&post_type=best', req, res, next);
  } else if (req.query.type === 'REUTERS_4') {
    getFeed('https://www.reutersagency.com/feed/?best-sectors=commodities-energy&post_type=best', req, res, next);
  } else if (req.query.type === 'REUTERS_5') {
    getFeed('https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best', req, res, next);
  } else {

  }
});

app.get('/fx-forrex/:path([a-z0-9./-]+)', (req, res, next) => {
  getCall(BASE_URL + req.originalUrl, null, req, res, next);
});

app.post('/fx-forrex/:path([a-z0-9./-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-forrex'] + '/' + req.params.path, req, res, next);
});

app.delete('/fx-forrex/:path([a-z0-9./-]+)', (req, res, next) => {
  deleteCall(BASE_URL + fxguardConfig['fx-forrex'] + '/' + req.params.path, req, res, next);
});
app.put('/fx-forrex/:path([a-z0-9./-]+)', (req, res, next) => {
  putCall(BASE_URL + fxguardConfig['fx-forrex'] + '/' + req.params.path, req, res, next);
});

app.get('/fx-kyc/:path([a-z0-9/-]+)', (req, res, next) => {
  // getCall(BASE_URL + fxguardConfig['fx-kyc'] + '/' + req.params.path, req.query, req, res, next);
  getCall(BASE_URL + req.originalUrl, null, req, res, next);
});
app.post('/fx-kyc/:path([a-z0-9/-]+)', (req, res, next) => {
  postCall(BASE_URL + fxguardConfig['fx-kyc'] + '/' + req.params.path, req, res, next);
});
app.put('/fx-kyc/:path([A-Z0-9+.@/-]+)', (req, res, next) => {
  putCall(BASE_URL + fxguardConfig['fx-kyc'] + '/' + req.params.path, req, res, next);
});
app.delete('/fx-kyc/:path([A-Z0-9+.@/-]+)', (req, res, next) => {
  deleteCall(BASE_URL + fxguardConfig['fx-kyc'] + '/' + req.params.path, req, res, next);
});

app.post('http://dev-fx-auth-server.us-east-2.elasticbeanstalk.com:9999/oauth/token', (req, res, next) => {
  res.json(['Tony', 'Lisa', 'Michael', 'Ginger', 'Food']);
});
app.get("*", cors(), function (req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});
