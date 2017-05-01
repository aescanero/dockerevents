var Client = require('node-rest-client').Client;

var options_proxy = {
	proxy: {
		host: "localhost",
		port: 8080,
		tunnel: false
	}
};

var client = new Client(options_proxy);

module.exports = {
  api_hello,
  api_check,
  api_hosts_ls,
  api_hosts_info
};

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

function api_hello(func, query, ref){
  ref({state: [0], ref: [func], data: "Monitor"});
}

function api_check(func, query, ref){
  var req = client.get("http://localhost:8500", args, function (data, response) {
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

function api_hosts_ls(func, query, ref){
  var req = client.get("http://localhost:8500/v1/catalog/nodes", args, function (data, response) {
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

function api_hosts_info(func, query, ref){
  if (query.ip==undefined) {
    res.send(JSON.stringify({state: [2], data: ""}));
  }
  var ip=query.ip;
  var name = query.node;
  console.log("Docker ip: " + ip);
  var req = client.get("http://" + ip + ":2375", args, function (data, response) {
    if (response.statusCode!=200){
       console.log(response.statusMessage);
       ref({state: [2], ref: [func, ip, name], data: [data]});
    }
    ref({state: [0], ref: [func, ip, name], data: [data]});
  });

  req.on('requestTimeout', function (req) {
  	console.log('request has expired');
  	req.abort();
    ref({state: [1], ref: [func, ip, name], data: ["request has expired"]});
  });

  req.on('responseTimeout', function (res) {
  	console.log('response has expired');
    ref({state: [1], ref: [func, ip, name], data: ["response has expired"]});
  });

  req.on('error', function (err) {
  	console.log('request error', err);
    ref({state: [1], ref: [func, ip, name], data: ["error"]});
  });
}
