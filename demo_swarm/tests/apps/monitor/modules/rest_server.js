var clientapi = require ('./rest_client');

module.exports = {
  callAPI
};

functions = {
  api_get_hello,
  api_get_getid,
  api_get_active
}

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
  ref({state: [0], ref: [func], data: "Monitor"});
}

function api_get_getid(func, req, ref){
  console.log("Hostname: " + req.query.hostname);
  if (req.ip==undefined || req.query.hostname==undefined) {
    ref({state: [2], ref: [func], data: "Undefined"});
  }
  var db = require('diskdb');
  db = db.connect('./DB', ['ldapcontainers']);
  console.log(db.ldapcontainers.count());
  console.log("TODOS: " + db.ldapcontainers.find());
  var ip=req.ip;
  if (ip.substr(0, 7)=="::ffff:") {
    ip = ip.substr(7);
  }
  console.log("IP: " + ip);
  for (var i = 0; i < 15; i++){
    console.log("Container i: " + i + ":" + db.ldapcontainers.findOne({id: i}));
    if ( db.ldapcontainers.findOne({id: i}) == undefined ){
      console.log("Container i: " + i + " Undefined!");
      var ldapcontainer = {
        id: i,
        ip: ip,
        hostname: req.query.hostname,
        runningq: 0,
        totalq: 0,
        uptime: 0
      };
      db.ldapcontainers.save(ldapcontainer);
      var containerList = db.ldapcontainers.find();
      ref({state: [0], ref: [func], data: { id: i, containerList } });
      return;
    } else {
      if(ip == db.ldapcontainers.findOne({id: i}).ip){
        var containerList = db.ldapcontainers.find();
        ref({state: [0], ref: [func], data: { id: i, containerList } });
        return;
      }
    }
    console.log("Container i OUT: " + i );
  }
  ref({state: [2], ref: [func], data: "Can't Open new Ids"});
}

function api_get_active(func, req, ref){
  var db = require('diskdb');
  db = db.connect('./DB', ['ldapcontainers']);
  var containers = db.ldapcontainers.find();
  var activeContainers=0;
  clientapi.setMinContainers(5,function(res){
    var containerData = res["data"][0];
    console.log(JSON.stringify(containerData[0]));
    for (var i=0; i < containerData.length ; i++){
      if (containerData[i]["Spec"]["Name"]=="ldap"){
        var activeContainers=containerData[i]["Spec"]["Mode"]["Replicated"]["Replicas"];
      }
    }
    ref({state: [0], ref: [func], data: activeContainers});
  });
}

function api_post_min(func, req, ref){
  ref({state: [0], ref: [func], data: ""});
}

function api_post_max(func, req, ref){
  ref({state: [0], ref: [func], data: ""});
}

function api_post_load(func, req, ref){
  ref({state: [0], ref: [func], data: ""});
}
