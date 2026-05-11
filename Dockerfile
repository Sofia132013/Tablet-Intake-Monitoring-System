FROM node:22

# incide Docker
WORKDIR /app

COPY front ./front
COPY backend ./backend
COPY .env .
COPY package.json .
COPY package-lock.json .

RUN npm install

EXPOSE 3000

WORKDIR backend
RUN npx prisma generate
CMD ["node", "server.js"]