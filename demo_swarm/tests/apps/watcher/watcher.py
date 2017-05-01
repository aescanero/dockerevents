#!/usr/bin/python

import daemon
import time
import json
import socket
import re
import ldap
import subprocess
import sys
import ldap.modlist as modlist
from restful_lib import Connection
from subprocess import check_output

#base_url = "http://monitor:3000/api"

#conn = Connection(base_url)
ldapcon = None

LOGLEVEL = 0

try:
    ldapcon = ldap.initialize('ldapi:///')
    ldapcon.simple_bind_s( "cn=admin,cn=config", "secret" )
except ldap.LDAPError, e:
    log ("Ldap connection error")
    killTheContainer()


def log (msg = "", level = 10):
    print msg
#    if (LOGLEVEL >= level):
#        print msg

def configureReplication(activeContainers, myId):
    containerLen = len( activeContainers["data"]["containerList"] )
    lastIp = None
    lastId = None
    nextIp = None
    nextId = None
    for i in range(containerLen):
        if (activeContainers["data"]["containerList"][i]["id"]==myId):
            if i > 0:
                log ("last -> %s: " %
                    activeContainers["data"]["containerList"][i - 1], 7)
                lastIp = activeContainers["data"]["containerList"][i - 1]["ip"]
                lastId = activeContainers["data"]["containerList"][i - 1]["id"]
            if i < containerLen - 1:
                log ("next -> %s: " %
                    activeContainers["data"]["containerList"][i + 1], 7)
                nextIp = activeContainers["data"]["containerList"][i + 1]["ip"]
                nextId = activeContainers["data"]["containerList"][i + 1]["id"]
            if i == 0 and containerLen > 1:
                log ("last -> %s: " %
                    activeContainers["data"]["containerList"][containerLen - 1], 7)
                lastIp = activeContainers["data"]["containerList"][containerLen - 1]["ip"]
                lastId = activeContainers["data"]["containerList"][containerLen - 1]["id"]
            if i == containerLen - 1 and containerLen > 1:
                log ("next -> %s: " %
                    activeContainers["data"]["containerList"][0], 7)
                nextIp = activeContainers["data"]["containerList"][0]["ip"]
                nextId = activeContainers["data"]["containerList"][0]["id"]
    partners = checkReplicationPartners()
    lastSyncRepl = None
    mods_attrs = []
    renewConf = False

    #Creating replication configuration for last container in
    #replication queue
    if (lastIp is not None):
        lastSyncRepl = "rid=%s provider=ldap://%s bindmethod=simple timeout=0 \
network-timeout=0 binddn=\"cn=admin,o=test,o=ok\" credentials=\"secret\" \
starttls=no filter=\"(objectclass=*)\" searchbase=\"o=test,o=ok\" scope=sub \
attrs=\"*,+\" schemachecking=off type=refreshAndPersist retry=\"5 5 300 +\"" \
% (lastId,lastIp)

    #Creating replication configuration for next container in
    #replication queue
    nextSyncRepl = None
    if (lastIp is not None):
        nextSyncRepl = "rid=%s provider=ldap://%s bindmethod=simple timeout=0 \
network-timeout=0 binddn=\"cn=admin,o=test,o=ok\" credentials=\"secret\" \
starttls=no filter=\"(objectclass=*)\" searchbase=\"o=test,o=ok\" scope=sub \
attrs=\"*,+\" schemachecking=off type=refreshAndPersist retry=\"5 5 300 +\"" \
% (nextId,nextIp)

    log ("LastIp: %s" % lastIp)
    log ("partners: %s" % partners)
    if (lastIp is  None and len(partners)>0):
        try:
            ldapcon.modify_s("olcDatabase={1}mdb,cn=config",
                [(ldap.MOD_DELETE, 'olcSyncrepl', partners["olcSyncrepl"][0])])
            renewConf = True
        except ldap.NO_SUCH_ATTRIBUTE:
            # There are no member in this group
            pass

    if (nextIp is  None and len(partners)>1):
        try:
            ldapcon.modify_s("olcDatabase={1}mdb,cn=config",
                [(ldap.MOD_DELETE, 'olcSyncrepl', partners["olcSyncrepl"][1])])
            renewConf = True
        except ldap.NO_SUCH_ATTRIBUTE:
            # There are no member in this group
            pass

    if (lastIp is not None and len(partners)>0):
        #TODO CHECK LDAP IP
        m = re.search('.*ldap://(.*)\ bindmethod.*',partners["olcSyncrepl"][0])
        if ( m.group(1) != lastIp ):
            try:
                mods_attrs.append( lastSyncRepl.encode("utf-8") )
                renewConf = True
            except ldap.NO_SUCH_ATTRIBUTE:
                # There are no member in this group
                pass

    if (nextIp is not  None and len(partners)>1):
        #TODO CHECK LDAP IP
        m = re.search('.*ldap://(.*)\ bindmethod.*',partners["olcSyncrepl"][1])
        if ( m.group(1) != nextIp ):
            try:
                mods_attrs.append( nextSyncRepl.encode("utf-8") )
                renewConf = True
            except ldap.NO_SUCH_ATTRIBUTE:
                # There are no member in this group
                pass

    if (lastIp is not None and len(partners)==0):
        #TODO CHECK LDAP IP
        try:
            mods_attrs.append( lastSyncRepl.encode("utf-8") )
            renewConf = True
        except ldap.NO_SUCH_ATTRIBUTE:
            # There are no member in this group
            pass

    if (nextIp is not  None and ( len(partners)==0 or len(partners)==1 )):
        #TODO CHECK LDAP IP
        try:
            mods_attrs.append( nextSyncRepl.encode("utf-8") )
            renewConf = True
        except ldap.NO_SUCH_ATTRIBUTE:
            # There are no member in this group
            pass

    if renewConf:
        try:
            log ('renewconf: %s' % mods_attrs)
            ldapcon.modify_s("olcDatabase={1}mdb,cn=config",
                [( ldap.MOD_REPLACE, 'olcSyncrepl', mods_attrs )])
            if (lastIp is None and nextIp is None):
                ldapcon.modify_s("olcDatabase={1}mdb,cn=config",
                    [( ldap.MOD_REPLACE, 'olcMirrorMode', "FALSE" )])
            else:
                ldapcon.modify_s("olcDatabase={1}mdb,cn=config",
                    [( ldap.MOD_REPLACE, 'olcMirrorMode', "TRUE" )])
        except ldap.NO_SUCH_ATTRIBUTE:
            # There are no member in this group
            pass

    try:
        if not ldapcon.compare_s("cn=config","olcServerID","%s" %
                activeContainers["data"]["id"]):
            log ('Compare: false')
            mod_attrs = [( ldap.MOD_REPLACE, 'olcServerID', "%s" %
                activeContainers["data"]["id"] )]
            if not ldapcon.modify_s('cn=config', mod_attrs):
                log ('Compare: false')
            else:
                log ('Error status code: ', status)
    except ldap.LDAPError, e:
        log ('Ldap connection error')
        killTheContainer()

def do_something():
    while True:

#        resp = conn.request_get("/getid", \
#        args = { "hostname": socket.gethostname() },  \
#        headers = \
#        {'content-type':'application/json', 'accept':'application/json'})
#        status = resp[u'headers']['status']
        # check that we either got a successful response (200) or a previously
        # retrieved, but still valid response (304)
#        if status == '200' or status == '304':
            #Get full list of active containers
#            activeContainers = json.loads(resp[u'body'])
#            log "load: %s" % activeContainers, 10
#            myId = activeContainers["data"]["id"]
#            log "myId: %s" % myId, 10
#            if myId == -1:
#                killTheContainer()
#            else:
#                configureReplication (activeContainers, myId)

        hostname = check_output("hostname").rstrip()
#        tasks = check_output("/usr/bin/nslookup tasks.demo_ldap 172.0.0.11", shell=True).split("\n")
        tasks = check_output("/usr/bin/nslookup tasks.demo_ldap", shell=True).split("\n")
        activeContainers = {}
        activeContainers["data"] = {}
        activeContainers["data"]["containerList"] = []
        myId = -1
        i = 0
        for task in tasks:
            node = re.search("Address\ (\d{1,3}):\ (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\ (.*)$",task)
            if node is not None:
                id = node.group(1)
                ip = node.group(2)
                nodename = node.group(3)
                print "Hostname %s -> %s" % (hostname,nodename)
                if hostname == nodename:
                    myId = id
                    activeContainers["data"]["id"]=id
                activeContainers["data"]["containerList"].append({"ip":ip,"id":id})
                activeContainers["data"]["containerList"][i]["ip"] = ip
                activeContainers["data"]["containerList"][i]["id"] = id
                i+=1
        log ("myId: %s" % myId, 10)
        if myId == -1:
            killTheContainer()
        else:
            configureReplication (activeContainers, myId)

        time.sleep(300)

def killTheContainer():
    # Kill the container!
    time.sleep(10)
    log ("killTheContainer")
#    subprocess.call("/usr/bin/supervisorctl -c /etc/supervisord.conf shutdown", shell=True)
    sys.exit()


def checkIndex(serverIndex):
    if not ldapcon.compare_s("cn=config","olcServerID", "%i" % serverIndex):
        log ('Replacing server index')
        mod_attrs = [( ldap.MOD_REPLACE, 'olcServerID', "%i" % serverIndex )]
        if not ldapcon.modify_s('cn=config', mod_attrs):
            log ('Failed to modify')
            killTheContainer()


def checkReplicationPartners():
    try:
        ldap_result_id = ldapcon.search_s("olcDatabase={1}mdb,cn=config",
            ldap.SCOPE_BASE, "(objectClass=*)", ['olcSyncrepl'])
        if ldap_result_id:
            return(ldap_result_id[0][1])
        else:
            return({})
    except ldap.LDAPError, e:
        log ("Failed to search olcSyncrepl: %s" % e)
        killTheContainer()


def run():
    with daemon.DaemonContext():
        do_something()


if __name__ == "__main__":
    try:
        ldapcon = ldap.initialize('ldapi:///')
        ldapcon.simple_bind_s( "cn=admin,cn=config", "secret" )
    except ldap.LDAPError, e:
        log ('Ldap connection error: %s' % e)
        ldapcon.unbind_s()
        killTheContainer()
    except ldap.INVALID_CREDENTIALS:
        log ("Username or password is incorrect.")
        killTheContainer()

    do_something()
    #run()
