# OKN Proto

*Note: This project is migrated from [here](https://github.com/zlwang-cs/OKN-Project) for further staging and production*

How to run this app locally.

## Install Docker

Make sure docker is properly installed in the system

## How to Start

clone the repo

```bash
git clone <repo>
```

Start docker daemon

Run docker

```bash
docker-compose up -d --build
```

To stop
```bash
docker-compose down
```

## Change Ports

### Server

change the following files
```bash
docker-compose.yml
./server/Dockerfile
./server/app.py
./client/src/components/charts/ShowChartsButton.tsx
```

In `docker-compose.yml` change the ports for server service

In `./servers/Dockerfile` change the EXPOSE <port>

In `./servers/app.py` change the app.run port declaration

In `./client/src/components/charts/ShowChartsButton.tsx` change the API request URL

### Client 

change the following files
```bash
docker-compose.yml
./client/Dockerfile
```

In `docker-compose.yml` change the ports for client service

In `./client/Dockerfile` change the EXPOSE <port>
