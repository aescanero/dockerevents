elasticmmldap
=============

Elastic Multi Master Replicatión OpenLdap deploy based in virtualbox/vagrant/docker/swarm
-----------------------------------------------------------------------------------------

Stage 2 Addedum 1.- Vagran box Baseline
------------------

Creating a base box for faster deployment

Include:
- last test release of docker
- docker compose via python-pip
- based in ubuntu xenial
- add glusterfs packages

```
$ mkdir ~/repository
$ git clone -b base_docker https://github.com/aescanero/elasticmmldap base_docker
$ cd base_docker
~/base_docker$ vagrant plugin install vagrant-vbguest
~/base_docker$ vagrant up
~/base_docker$ vagrant halt
~/base_docker$ vagrant package --output ~/repository/base_docker.box
~/base_docker$ vagrant box add ~/repository/base_docker.box --name elasticmmldap/base_docker
~/base_docker$ vagrant destroy -f
```

