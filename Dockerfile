FROM --platform=linux/amd64 node:18-alpine

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 80

CMD ["node", "main.js"]