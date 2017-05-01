var ldap = require('ldapjs');
var db = require('diskdb');
const assert = require('assert');
db = db.connect('./DB', ['ldapcontainers']);

module.exports = {
  ldapTest
};

function ldapConnect(container, ref){
  ip = container.ip;
  var updatedContainer = container;
  console.log("Orig: " + updatedContainer);
  process.on('uncaughtException', function (err) {
    console.log("uncaughtException Ldap with ip " + ip + " error: " + err);
    ref(false, ip);
  });
  console.log("Check Ldap with ip " + ip);
  var client = ldap.createClient({
    url: 'ldap://' + ip + ':389'
  });
  console.log("Check Bind Ldap with ip " + ip);
  client.bind('cn=admin,o=test,o=ok', 'secret', function(err, result) {
    if (result.status!=0) {
      client.unbind();
      console.log("Ldap with ip " + ip + " bind failed. Error: " + err);
      ref(false, ip);
    }else{
      var monitoredInfo = 0;
      var opts = {
        filter: '(monitorOpCompleted=*)',
        scope: 'base',
        attributes: ['monitorOpCompleted']
      };
      client.search('cn=Operations,cn=Monitor', opts, function(err, res) {
        res.on('searchEntry', function(entry) {
          updatedContainer.totalq = entry.object["monitorOpCompleted"];
          opts = {
            filter: '(monitoredInfo=*)',
            scope: 'base',
            attributes: ['monitoredInfo']
          };
          client.search('cn=Uptime,cn=Time,cn=Monitor', opts, function(err, res) {
            res.on('searchEntry', function(entry) {
              updatedContainer.uptime = entry.object["monitoredInfo"];
              if (updatedContainer.uptime == 0) updatedContainer.uptime = 1;
              updatedContainer.runningq = Math.round(updatedContainer.totalq / updatedContainer.uptime / 60);
              var updates = db.ldapcontainers.update(container,updatedContainer);
              console.log(updates);
              client.unbind(function(err) {
                assert.ifError(err);
              });
              ref(true, ip);
            });
            res.on('error', function(err) {
              console.error('error: ' + err.message);
              ref(false);
            });
            res.on('end', function(result) {
              client.unbind(function(err) {
                assert.ifError(err);
              });
            });
          });
        });
        res.on('error', function(err) {
          console.error('error: ' + err.message);
          ref(false);
        });
        res.on('end', function(result) {
          client.unbind(function(err) {
            assert.ifError(err);
          });
        });
      });
    }
  });
  client.unbind(function(err) {
    assert.ifError(err);
  });
  ref(true, ip);
}

function ldapTest(){
  console.log("Check Ldap");
  var containers = db.ldapcontainers.find();
  for (var i=0; i < containers.length ; i++){
    var state = ldapConnect(containers[i], function(state, ip){
      if(state==false){
        console.log("Removing...");
        db.ldapcontainers.remove({
          ip: ip
        });
      }
      console.log("State: " + state);
    });
  }
}
