var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var index = require('./routes/index');
var users = require('./routes/users');
var recordings = require('./routes/recordings');
var debug = require('debug')('analytics-site:server');
var http = require('http');
var Nexmo = require('nexmo');
var rp = require('request-promise');
// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const fs = require('fs');

// Your Google Cloud Platform project ID
const projectId = 'robust-magpie-162614';

// Creates a client
const client = new speech.SpeechClient({
  projectId: projectId,
  keyFilename: './My Project-fc64d1d3b16c.json'
});

/*
informed 
page-access-token:hello
key:infusion
*/

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
var app = express();

var recordingStore=[
  {
    type: "Job Interview",
    transcription: ["What role do you see yourself playing at this company?"," Essentially whatever role needs filling, I'm a flexible team player. While I appreciate the role is explicitly for a full-stack developer I hold other interests in AI and design and would be eager to assist in tasks related to these topics. I'm eager to pick up new skills and explore new tech and ways of approaching things."," Great thanks, if we were to offer you a job when would you be available to start?"," September 2018."],
    key_phrases:[ {keyPhrases:['role','company']}, {keyPhrases:["eager", "skills", "AI", "tech", "learn", "design"]}, {keyPhrases:["start"]}, {keyPhrases:["september", "2018"]}],
    emotions: [{score:0},{score:1},{score:0.5},{score:0}],
    uuid:"default"
  }


];

// view engine setup
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));




var nexmo = new Nexmo({
  apiKey: "11814827",
  apiSecret: "691a8e13de0d4480",
  applicationId: "568436b4-b8fb-4b4a-8bb0-f2f3916b90d2",
  privateKey: "private.key",
});


var sentiment={
  method:'POST',
  uri: 'https://northeurope.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
  headers:{
    "Ocp-Apim-Subscription-Key" : "f6f30f0002c7474b8df202b58a2e3528"
  },
  body:{
    "documents": [
      
            ]
  },
  json:true
};

var keyPhrases={
  method:'POST',
  uri: 'https://northeurope.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases',
  headers:{
    "Ocp-Apim-Subscription-Key" : "f6f30f0002c7474b8df202b58a2e3528"
  },
  body:{
    //array of sentences?
      "documents": [

      ]
  },
  json:true
};

var splitSent=function(transcription){
  var hi = transcription.split("\n");
  return hi;
}

var storeConvoData=function(transcription,uuid, convoType){
  transcription=splitSent(transcription);
  keyPhrases.body.documents=[];
  sentiment.body.documents=[];

  convoType=parseInt(convoType);
  if(convoType==1){
    convoType="Job Interview";
  }else if(convoType==2){
    convoType="Small Talk";
  }else{
    convoType="";
  }
  
  for(var t=0; t< transcription.length;t++){
    keyPhrases.body.documents.push(
      {
        "id": "main"+String(t),
        "text": transcription[t]
      }
    );
    sentiment.body.documents.push(
      {
        "id": "main"+String(t),
        "text": transcription[t]
      }
    );
  }
  //keyPhrases.body.documents[0].text=transcription;
  rp(keyPhrases)
  .then(function (parsedBody) {
    console.log(JSON.stringify(parsedBody));

    rp(sentiment)
      .then(function (parsedBody2) {
        console.log(JSON.stringify(parsedBody2));
        recordingStore.push({
          "type": convoType,
          "transcription": transcription,
          "key_phrases":parsedBody.documents,
          "emotions": parsedBody2.documents,
          "uuid":uuid
        });
      }).catch(function (err) {
        console.log("Error: ", err);
        recordingStore.push({
          "type": convoType,
          "transcription": transcription,
          "key_phrases":parsedBody.documents,
          "emotions": [],
          "uuid":uuid
        });
          // POST failed...
      });
  })
  .catch(function (err) {
    console.log("Error: ", err);
      // POST failed...
      rp(sentiment)
      .then(function (parsedBody2) {
        console.log(JSON.stringify(parsedBody2));
        recordingStore.push({
          "type": convoType,
          "transcription": transcription,
          "key_phrases":[],
          "emotions": parsedBody2,
          "uuid":uuid
        });
      }).catch(function (err) {
        console.log("Error: ", err);
        recordingStore.push({
          "type": convoType,
          "transcription": transcription,
          "key_phrases":[],
          "emotions": [],
          "uuid":uuid
        });
          // POST failed...
      });


  });
}

/*
rp(options)
    .then(function (parsedBody) {
        // POST succeeded...
    })
    .catch(function (err) {
        // POST failed...
    });
*/

//app.use('/', index);
//key Nexmo token Infusion
/* GET home page. */
app.get('/', function(req, res, next) {
  console.log("RENDERING PAGE!!!!!")
  res.render('index', { title: 'PhonyConvo', recordings: recordingStore });
});

app.use('/users', users);

app.use('/bots', function(req, res, next) {
  console.log("SOMEONE WANTS TO KNOW ABOUT THE BOTS");
  console.log(req.body);
  //console.log(req.params);
  var ncco = [
    {
      "action": "talk",
      "text": "Sorry I didn't catch that. Please press 1 for interview prep and 2 for small talk followed by hash",
      "voiceName": "Amy"
    },
    {
      "action": "input",
      "timeOut":10,
      "submitOnHash": true,
      "eventUrl": ["http://phonyconvo-env.us-west-2.elasticbeanstalk.com/bots"]
    }
  ];
  //need to add bot connections here!
  if(req.body.dtmf=="1"){
    ncco = [
      {
        "action": "record",
        "eventUrl": [
            "http://cityhack-env.us-west-2.elasticbeanstalk.com/recordings/1"
        ],
        "beepStart": true
    },
      {
        "action": "talk",
        "text": "Thank you, now your interview prep will begin.",
        "voiceName": "Amy"
      },
      {
        "action": "connect",
        "endpoint": [
            {
                "content-type": "audio/l16;rate=16000",
                "headers": {
                    "aws_key": "AKIAIXGOMSYJLA72LVCA",
                    "aws_secret": "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"
                },
                "type": "websocket",
                "uri": "wss://lex-us-east-1.nexmo.com/bot/JobInterview/alias/JobInterview/user/chatbot/content"
            }
        ],
        "eventUrl": [
            "http://phonyconvo-env.us-west-2.elasticbeanstalk.com/trackBot"
        ]
    }
    ];
  }else if(req.body.dtmf=="2"){
    ncco = [
      {
        "action": "record",
        "eventUrl": [
          "http://cityhack-env.us-west-2.elasticbeanstalk.com/recordings/2"
        ],
        "beepStart": true
    },
      {
        "action": "talk",
        "text": "Thank you, now your small talk prep will begin.",
        "voiceName": "Amy"
      },
      {
        "action": "connect",
        "endpoint": [
            {
                "content-type": "audio/l16;rate=16000",
                "headers": {
                    "aws_key": "AKIAIXGOMSYJLA72LVCA",
                    "aws_secret": "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"
                },
                "type": "websocket",
                "uri": "wss://lex-us-east-1.nexmo.com/bot/SocialSituation/alias/SocialSituation/user/chatbot/content"
            }
        ],
        "eventUrl": [
            "http://phonyconvo-env.us-west-2.elasticbeanstalk.com/trackBot"
        ]
    }
    
    ];
  }

    res.json(ncco);
    
});



app.use('/trackBot', function(req, res, next) {
  console.log("Tracking bot", req.body, req.params);
  res.sendStatus(200);
});

app.use('/recordings/:convoType', function(req, res, next) {
  console.log("received recording information!!")
  console.log(req.body);
  console.log(recordingStore);
  //recordingStore.push(req.body);
  
  var fileName="";
  var uuid="";
  var convoType=req.params.convoType;
  if(req.body.recording_url){
    // The name of the audio file to transcribe
    console.log("new recording");
    fileName = req.body.recording_url;
    uuid= req.body.conversation_uuid;
    const from = 'PhonyConvo';
    const to = "+447804038740";
    const text = 'The uuid you are using is:'+ String(uuid);
    nexmo.message.sendSms(from, to, text);


  }else{
    const from = 'PhonyConvo';
    const to = "+447804038740";
    const text = 'The uuid you are using is: default';
    nexmo.message.sendSms(from, to, text);
    fileName="https://api.nexmo.com/v1/files/5d3bfd2b-227d-4a03-ae24-5d05479f9651";
    uuid="default";
  }
  console.log("the filename is", fileName);
  // Reads a local audio file and converts it to base64
  //const file = fs.readFileSync(fileName);

  nexmo.files.get(fileName, function(err, data){

    if(err){
      console.log(err);
      res.sendStatus(500);
    }else{
      fs.writeFile('./recording.mp3', data, function(err) {
        if (err) throw err;
        
        var track = './recording.mp3';//your path to source file
        
        ffmpeg(track)
        .toFormat('wav')
        .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
        })
        .on('progress', function (progress) {
            // console.log(JSON.stringify(progress));
            console.log('Processing: ' + progress.targetSize + ' KB converted');
        })
        .on('end', function () {
            console.log('Processing finished !');

            
              //console.log("SAVED");
              var data = fs.readFileSync("./recording.wav");
              const audioBytes = data.toString('base64');
              //console.log(audioBytes);
              // The audio file's encoding, sample rate in hertz, and BCP-47 language code
              const audio = {
                content: audioBytes,
              };
              const config = {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
              };
              const request = {
                audio: audio,
                config: config,
              };
      
              // Detects speech in the audio file
              client
              .recognize(request)
              .then(data => {
                console.log(data);
                console.log(data[0]);
                const response = data[0];
                const transcription = response.results
                  .map(result => result.alternatives[0].transcript)
                  .join('\n');
                console.log(`Transcription: ${transcription}`);
                storeConvoData(transcription, uuid, convoType);
                
                res.sendStatus(200);
              })
              .catch(err => {
                console.error('ERROR:', err);
              });

        })
        .save('./recording.wav');//path where you want to save your file

        //res.sendStatus(200);
      });
    }

  });

});

app.get("/listRecordings", function(req, res, next) {
  console.log("listing recording information!!")
  res.send(recordingStore);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  console.log(addr);
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


