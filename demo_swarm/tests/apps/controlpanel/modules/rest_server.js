var Client = require('node-rest-client').Client;

var client = new Client();

module.exports = {
  callAPI
};

functions = {
  api_get_hello,
  api_get_active
}

var args = {
	path: { "dc": "elasticmmldap" },
	parameters: {},
	headers: { },
	data: "",
	requestConfig: {
		timeout: 1000, //request timeout in milliseconds
		noDelay: true, //Enable/disable the Nagle algorithm
		keepAlive: true, //Enable/disable keep-alive functionalityidle socket.
		keepAliveDelay: 1000 //and optionally set the initial delay before the first keepalive probe is sent
	},
	responseConfig: {
		timeout: 1000 //response timeout
	}
};

function callAPI(req, res, type){
    if (req.baseUrl == ''){
      req.baseUrl="/api/hello";
    }
    console.log("API GET: "+req.baseUrl);
    res.setHeader('Content-Type', 'application/json');
    //var urlRe="/https?:\/\/[-a-zA-Z0-9@:%\.\_\+~#=]{2,256}\/?([^\/\?]*)?\/?([^\/\?]*)?\/?([^\/\?]*)?\/?([^\/\?]*)?\??[^\s]*?/i";
    //var urlBaseRe = new RegExp('\/?([^\/\?]*)?\/?([^\/\?]*)?\/?([^\/\?]*)?\/?([^\/\?]*)?\??[^\s]*?');
    var urlBaseRe = new RegExp(/\/?([^\/\?]*)?\/?([^\/\?]*)?\/?([^\/\?]*)?\/?([^\/\?]*)?\??[^\s]*?/);
    var urlItems = urlBaseRe.exec(req.baseUrl);
    func_name = "api_" + type;
    for (var i = 2; i < urlItems.length; i++) {
      if (urlItems[i]!=undefined) func_name=func_name+"_"+urlItems[i];
    }
    try {
        functions[func_name](func_name, req ,function(jsonResponse){
        try{
          console.log(JSON.stringify(jsonResponse));
          res.send(JSON.stringify(jsonResponse));
        }
        catch(e){
          console.log("Exception: " + e);
        }
      });
    }
    catch(err) {
      console.log("ERROR: Call: " + req.baseUrl + ":" + func_name + ":" + err);
      res.send(JSON.stringify({state: [2],data: ""}));
    }
}

function api_get_hello(func, req, ref){
  ref({state: [0], ref: [func], data: "ControlPanel"});
}

function api_get_active(func, req, ref){
  ref({state: [0], ref: [func], data: [{
    id: 1,
    ip: "192.168.1.1",
    hostname: "req.query.hostname",
    runningq: 0,
    totalq: 0,
    uptime: 0
  },{
    id: 2,
    ip: "192.168.1.2",
    hostname: "req.query.hostname",
    runningq: 5,
    totalq: 5,
    uptime: 10
  }]});
  return;
  var req = client.get("http://monitor:3000/api/active", args, function (data, response) {
    if (response.statusCode!=200){
       console.log(response.statusMessage);
       ref({state: [2], ref: [func], data: [response.statusMessage]});
    }
    ref({state: [0], ref: [func], data: [data]});
  });

  req.on('requestTimeout', function (req) {
  	console.log('request has expired');
  	req.abort();
    ref({state: [1], ref: [func], data: ["request has expired"]});
  });

  req.on('responseTimeout', function (res) {
  	console.log('response has expired');
    ref({state: [1], ref: [func], data: ["response has expired"]});
  });

  req.on('error', function (err) {
  	console.log('request error', err);
    ref({state: [1], ref: [func], data: ["error"]});
  });
}

function api_post_min(func, req, ref){
  var req = client.post("http://monitor:3000/api/min", args, function (data, response) {
    if (response.statusCode!=200){
       console.log(response.statusMessage);
       ref({state: [2], ref: [func], data: [response.statusMessage]});
    }
    ref({state: [0], ref: [func], data: [data]});
  });

  req.on('requestTimeout', function (req) {
  	console.log('request has expired');
  	req.abort();
    ref({state: [1], ref: [func], data: ["request has expired"]});
  });

  req.on('responseTimeout', function (res) {
  	console.log('response has expired');
    ref({state: [1], ref: [func], data: ["response has expired"]});
  });

  req.on('error', function (err) {
  	console.log('request error', err);
    ref({state: [1], ref: [func], data: ["error"]});
  });
}

function api_post_max(func, req, ref){
  var req = client.post("http://monitor:3000/api/max", args, function (data, response) {
    if (response.statusCode!=200){
       console.log(response.statusMessage);
       ref({state: [2], ref: [func], data: [response.statusMessage]});
    }
    ref({state: [0], ref: [func], data: [data]});
  });

  req.on('requestTimeout', function (req) {
  	console.log('request has expired');
  	req.abort();
    ref({state: [1], ref: [func], data: ["request has expired"]});
  });

  req.on('responseTimeout', function (res) {
  	console.log('response has expired');
    ref({state: [1], ref: [func], data: ["response has expired"]});
  });

  req.on('error', function (err) {
  	console.log('request error', err);
    ref({state: [1], ref: [func], data: ["error"]});
  });
}

function api_post_load(func, req, ref){
  var req = client.post("http://monitor:3000/api/load", args, function (data, response) {
    if (response.statusCode!=200){
       console.log(response.statusMessage);
       ref({state: [2], ref: [func], data: [response.statusMessage]});
    }
    ref({state: [0], ref: [func], data: [data]});
  });

  req.on('requestTimeout', function (req) {
  	console.log('request has expired');
  	req.abort();
    ref({state: [1], ref: [func], data: ["request has expired"]});
  });

  req.on('responseTimeout', function (res) {
  	console.log('response has expired');
    ref({state: [1], ref: [func], data: ["response has expired"]});
  });

  req.on('error', function (err) {
  	console.log('request error', err);
    ref({state: [1], ref: [func], data: ["error"]});
  });
}
