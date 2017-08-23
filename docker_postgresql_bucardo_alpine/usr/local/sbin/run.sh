#!/bin/sh

sleep 10 
/usr/bin/postgres -D /data/postgresql -c config_file=/data/postgresql/postgresql.conf
