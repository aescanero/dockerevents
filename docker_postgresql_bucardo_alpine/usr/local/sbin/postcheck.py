#!/usr/bin/python

import daemon
import time
import socket
import re
import subprocess
import sys
from restful_lib import Connection
from subprocess import check_output

LOGLEVEL = 0

def log (msg = "", level = 10):
    if (LOGLEVEL >= level):
        print msg

def do_something():
    while True:

        hostname = check_output("hostname")
        tasks = check_output(["/usr/bin/nslookup","tasks.postgresql"], shell=True)
        tasks = split(out,"\n")
#     3  bucardo install --batch
#    4  bucardo show
#    5  bucardo show all
#   11  su postgres -c createdb test1
#   16  bucardo add db test1 dbname=test1
#   17  bucardo add db test2 dbname=test2
#   18  bucardo add all tables db=test1 -T history --herd=alpha --verbose
#   23  bucardo add sync benchdelta relgroup=alpha dbs=test1:source,test2:target

        activeContainers = {}
        activeContainers["data"] = {}
        activeContainers["data"]["containerList"] = []
        i = 0
        myId = -1
        for task in tasks:
            node = re.search("Address\ (\d{1,3}):\ (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\ (.*)$",out)
            if node is not None:
                id = node.group(1)
                ip = node.group(2)
                nodename = node.group(3)
                if hostname == nodename:
                    myId = id
                activeContainers["data"]["containerList"][i] = {}
                activeContainers["data"]["containerList"][i]["ip"] = ip
                activeContainers["data"]["containerList"][i]["id"] = id
        log ("myId: %s" % myId, 10)
#        if myId == -1:
#            killTheContainer()
#        else:
#            configureReplication (activeContainers, myId)

        time.sleep(10)

def killTheContainer():
    # Kill the container!
    subprocess.call("/usr/bin/supervisorctl -c /etc/supervisord.conf shutdown", shell=True)
    sys.exit()


def run():
    with daemon.DaemonContext():
        do_something()


if __name__ == "__main__":
    do_something()

