FROM node:24-alpine

RUN apk --no-cache add curl

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN rm -rf node_modules && \
    npm i

COPY prisma ./prisma

COPY . .

RUN npx prisma generate

CMD ["npm", "run", "dev"]