#!/bin/sh

HOSTNAME=`hostname`

if ! [ -d /data/vol/${HOSTNAME} ]
then
  mkdir -p /data/vol/${HOSTNAME}
  ln -s /data/vol/${HOSTNAME} /data/postgresql
  chown postgres /data/postgresql/
  mkdir -p /run/postgresql && chown postgres /run/postgresql
  su postgres -c "/usr/bin/initdb --pgdata /data/postgresql/" 
else
  ln -s /data/vol/${HOSTNAME} /data/postgresql
  chown postgres /data/postgresql/
  mkdir -p /run/postgresql && chown postgres /run/postgresql
fi
