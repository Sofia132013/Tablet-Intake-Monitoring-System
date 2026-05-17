FROM node:22

# inside Docker
WORKDIR /app

COPY front ./front
COPY backend ./backend
COPY package.json .
COPY package-lock.json .

RUN npm install

EXPOSE ${OPEN_SERVER_PORT}

WORKDIR backend
RUN npx prisma generate

CMD ["bash", "-c", "npx prisma migrate deploy && node server.js"]
