var express = require('express');
var later = require('later');
var sched5sec = later.parse.recur().every(5).second();
var timer5sec = later.setInterval(testRunningContainers, sched5sec);
var app = express();
var routerHtml = express.Router();
var routerCss = express.Router();
var routerRest = express.Router();
var path = require('path');
var serverapi = require ('./modules/rest_server');
var clientapi = require ('./modules/rest_client');
var clientLdap = require ('./modules/ldap_client');

global.actualMinContainers = 0;
global.actualMaxContainers = 15;
global.actualMaxLoad = 100;

routerHtml.get('/', function(req, res) {
  if (req.baseUrl == ''){
    req.baseUrl="/index.html";
  }
  res.setHeader('Content-Type', 'text/html');
  console.log(req.baseUrl);
  fs = require('fs')
  fs.readFile(__dirname + req.baseUrl, 'utf8', function (err,data) {
    if (err) {
      console.log(err);
      console.log(__dirname + 'index.html');
      return console.log(req.baseUrl);
    }
    res.send(data);
  });
});

routerCss.get('/', function(req, res) {
  if (req.baseUrl == ''){
    req.baseUrl="/index.css";
  }
  res.setHeader('Content-Type', 'text/css');
  console.log(req.baseUrl);
  fs = require('fs')
  fs.readFile(__dirname + req.baseUrl, 'utf8', function (err,data) {
    if (err) {
      console.log(err);
      console.log(__dirname + 'index.html');
      return console.log(req.baseUrl);
    }
    res.send(data);
  });
});

routerRest.get('/', function(req, res) {
  serverapi.callAPI(req, res, "get");
});

routerRest.post('/', function(req, res) {
  serverapi.callAPI(req, res, "post");
});

routerRest.delete('/', function(req, res) {
  serverapi.callAPI(req, res, "delete");
});

routerRest.put('/', function(req, res) {
  serverapi.callAPI(req, res, "put");
});

app.use ('/*html',routerHtml);
app.use ('/',routerHtml);
app.use ('/*css',routerCss);
app.use ('/api/*',routerRest);

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
  console.log(__dirname);
});

function testRunningContainers(){
  console.log("Running tests");
  clientLdap.ldapTest();
}
