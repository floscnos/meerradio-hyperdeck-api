FROM --platform=linux/amd64 node:18-alpine
ENV HYPERDECK_IP=notset
ENV PORT=3000

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

ENTRYPOINT ["node", "main.js"]