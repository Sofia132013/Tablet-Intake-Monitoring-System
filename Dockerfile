FROM node:22

# inside Docker
WORKDIR /app

COPY front ./front
COPY backend ./backend
COPY .env .
COPY package.json .
COPY package-lock.json .

RUN npm install

EXPOSE ${OPEN_PORT}

WORKDIR backend
RUN npx prisma generate

CMD ["node", "server.js"]
