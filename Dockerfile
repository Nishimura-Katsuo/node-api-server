FROM node:lts-buster-slim
ENV NAME node-api-server
ENV DEBIAN_FRONTEND noninteractive
RUN mkdir /var/www
RUN mkdir /var/www/html
RUN mkdir /var/www/node-api-server/
WORKDIR /var/www/node-api-server/
COPY . .
EXPOSE 22345
ENTRYPOINT ["npm", "start"]
