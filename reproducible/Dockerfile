FROM node:13-slim

RUN apt-get update -y
RUN apt-get install -y git python3 make wget unzip jq

RUN mkdir /build
WORKDIR /build
COPY entrypoint.sh /entrypoint.sh

VOLUME [ "/build" ]
ENTRYPOINT [ "/entrypoint.sh" ]