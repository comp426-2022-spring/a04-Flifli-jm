const db = require('./database.js')
const express = require('express')
const app = express();
const fs = require('fs')
const morgan = require('morgan')
const minimist = require('minimist')
const args = minimist(process.argv.slice(2));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
//loging db
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    console.log(logdata)
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(
        logdata.remoteaddr, 
        logdata.remoteuser, 
        logdata.time, 
        logdata.method, 
        logdata.url, 
        logdata.protocol, 
        logdata.httpversion, 
        logdata.status, 
        logdata.referrer, 
        logdata.useragent)
    next();
})
args["port"]
const HTTP_PORT = args["port"] || 5555;

// Store help text 
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

//start an app server
const server = app.listen (HTTP_PORT, () => {
    console.log("App listening on port %PORT%".replace("%PORT%", HTTP_PORT));
});

if (args.log == 'false') {
    console.log("Nothing")
  
  } else {
    const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

if (args.debug) {
    app.get('/app/log/access/', (req, res,next) => {
            const stmt = db.prepare('SELECT * FROM accesslog').all()
	        res.status(200).json(stmt); 
    })
    app.get('/app/error/', (req, res,next) => {
        throw new Error('Error test success')
    })
}

app.get("/app/", (req, res,next) => {
  res.status(200).json("200 OK");
});


app.get("/app/flip/", (req, res,next) => {
    var flip = coinFlip()
    return res.status(200).json({
        "flip" : coinFlip()
    })
})


app.get('/app/flips/:number', (req, res,next) => {
    const raw = coinFlips(req.params.number);
    const summary = countFlips(raw);
    res.status(200).json({
        "raw": raw,
        "summary": summary
    });
});



app.get("/app/flip/call/heads", (req, res,next) => {
    return res.status(200).json(flipACoin("heads"))
})

app.get("/app/flip/call/tails", (req, res,next) => {
    return res.status(200).json(flipACoin("tails"))
})

app.use(function(req, res){
    res.status(404).send("404 NOT FOUND")
})

//coinFlip()
function coinFlip() {
    return ((Math.floor(Math.random() * 2)) == 0) ? ("heads") : ("tails") ;
  
}
  
function coinFlips(flips) {
    let ans = new Array();
    while(flips >= 0) {
      ans[flips] = coinFlip();
      flips--;
    }
    return ans;
}

function countFlips(array) {
    let cntHead = 0;
    let cntTail = 0;
    let i = 0;
    for (i = 0; i < array.length; i++) {
      if(array[i] == 'heads') cntHead++;
      else cntTail++;
    }
    let cnt = {tails: cntTail, heads: cntHead}
    return cnt;
 }

function flipACoin(call) {
    let re = coinFlip();
    let result = '';
    if(call == 'heads' || call == 'tails') {
      if(call == re) result = 'win';
      else result = 'lose';
    }
    let ans = {call: call, flip: re, result: result}
    return ans;
}