FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev
RUN npx prisma generate

COPY src ./src

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/server.js"]
