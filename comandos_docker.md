### primera imagen
docker build -t primera_imagen .

### ver imagenes
docker images

### ejecutar contenedor
docker run primera_imagen
docker run hello-world

### ver contenedores
docker ps -a

### correr un contenedor y eliminarlo al salir
docker run --rm primera_imagen

### version de docker 
docker --version

### version de docker compose
docker compose version

### informacion de docker
docker info

### contenedor de python
docker run -it --rm python:3.12 python

### contenedor de node
docker run -it --rm node:20 node 
docker run -it --rm node:20 node --version


### ubuntu bash
docker run -it --rm 'ubuntu:latest' bash

### ver logs

docker logs <nombre_contenedor>

### ver logs en tiempo real
docker logs -f <nombre_contenedor>


### detener contenedor
docker stop <nombre_contenedor>

### listar contenedores
docker ps -a

### listar contenedores en ejecucion
docker ps

### eliminar contenedor
docker rm <nombre_contenedor>

### listar imagenes
docker images


### variables de entorno
docker run -e "NOMBRE=Juan" -e "APELLIDO=Perez"

### levantar la aplicacion con docker y variables de entorno con archivo .env
docker run -d -p 8080:80 --env-file .env --name seguimiento-envios-app 



----

## levantar la aplicacion con docker

- crear la imagen
docker build -f DockerFile -t seguimiento-envios:1.0 .

- Levantar el contenedor
docker run --name seguimiento-envios-app -p 8080:80 seguimiento-envios:1.0

- Si quieres que el contenedor quede corriendo en segundo plano:
docker run -d --name seguimiento-envios-app -p 8080:80 seguimiento-envios:1.0

- Subir la imagen a Docker Hub o a un registry:
docker tag seguimiento-envios:1.0 tuusuario/seguimiento-envios:1.0
docker push tuusuario/seguimiento-envios:1.0

- En el otro equipo:
docker pull tuusuario/seguimiento-envios:1.0
docker run -d --name seguimiento-envios-app -p 8080:80 tuusuario/seguimiento-envios:1.0

