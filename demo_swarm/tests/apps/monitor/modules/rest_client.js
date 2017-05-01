var Client = require('node-rest-client').Client;
var client = new Client();
var sys = require('sys')
var exec = require('child_process').exec;

var minContainers = 3;
var maxContainers = 15;
var maxLoad = 300;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

module.exports = {
  client_check,
  client_service_list,
  client_service_scale,
  setMinContainers
};

var args = {
	path: { "dc": "elasticmmldap" },
	parameters: {},
	headers: { },
	data: "",
  connection: {
        rejectUnauthorized: false
  },
  rejectUnauthorized: false,
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

function client_check(func, req, ref){
  var req = client.get("https://" + getGW() + ":2376", args, function (data, response) {
    if (response.statusCode!=200){
       console.log(response.statusMessage);
       ref({state: [2], ref: [func], data: [data]});
    }
    ref({state: [0], ref: [func], data:""});
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
    ref({state: [2], ref: [func], data: ["error"]});
  });
}

function getGW(ref){
  exec("route -n|grep 'UG'|awk '{print $2}'", function (error, stdout, stderr) {
    myGW=stdout;
    console.log('Gateway: ' + myGW.trim());
    if (error !== null) {
      console.log('exec error: ' + error);
      ref(undefined);
    }else{
      ref(myGW.trim());
    }
  });
}

function client_service_list(func, req, ref){

  getGW(function(gateway){
    var req = client.get("https://" + gateway + ":2376/services", args, function (data, response) {
      if (response.statusCode!=200){
         console.log("Services: " + response.statusMessage);
         ref({state: [2], ref: [func], data: [response.statusMessage]});
      }else{
        console.log("Services 200: " + response.statusMessage + ":" + data);
        ref({state: [0], ref: [func], data: [data]});
      }
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
  });
}

function client_service_scale(func, req, ref){
  serviceName = req.query.serviceName;
  replicas = req.query.replicas;

  var args = {
    data: {
      "Name": serviceName,
      "Mode": {
        "Replicated": {
          "Replicas": replicas
        }
      }
    },
    headers: { "Content-Type": "application/json" }
  };

  getGW(function(gateway){
    var req = client.post("https://" + gateway + ":2376/services/" + serviceName + "/update", args, function (data, response) {
      if (response.statusCode!=200){
         console.log(response.statusMessage);
         ref({state: [2], ref: [func], data: [response.statusMessage]});
      }else{
        ref({state: [0], ref: [func], data: [response.statusMessage]});
      }
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

  });
}

function setMinContainers(num, ref){
  global.actualMinContainers = num;
  getGW(function(gateway){
    if (gateway != undefined){
      client_service_list("internal",gateway, function(res){
        console.log(res);
        ref(res);
      });
    }else{
      global.actualMinContainers = 0;
      ref(0);
    }
  });

}
