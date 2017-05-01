En swarm-master-01:
'''
cd ~/tests/
sudo docker run -it -d -p 3000:8080 -v /var/run/docker.sock:/var/run/docker.sock dockersamples/visualizer
sudo docker network create -d overlay be
sudo docker network create -d overlay fe
sudo docker service create --constraint=engine.labels.myproject.service==fe --endpoint-mode vip --network fe --publish 5000:5000 --restart-condition any --name registry registry

sudo docker build -t myproject:ldap_v1 -f Dockerfile_fusiondirectory_ldap .
sudo docker build -t myproject:fd_v1 -f Dockerfile_fusiondirectory_debian .

sudo docker tag myproject:ldap_v1 localhost:5000/myproject:ldap_v1
sudo docker push localhost:5000/myproject:ldap_v1
sudo docker tag myproject:fd_v1 localhost:5000/myproject:fd_v1
sudo docker push localhost:5000/myproject:fd_v1

sudo docker stack deploy demo -c docker-compose.yml
'''
