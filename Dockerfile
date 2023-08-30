FROM --platform=linux/amd64 node:alpine
WORKDIR '/app'

ADD config ./config
COPY package.json .
COPY server.js .
COPY .env .
ADD client/build ./client/build
RUN npm install

EXPOSE 80
CMD ["npm", "start"]