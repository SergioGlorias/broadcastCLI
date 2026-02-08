FROM node:24-trixie-slim

WORKDIR /app

COPY . /app

RUN npm install --global pnpm && \
    pnpm install && \
    pnpm build && \
    npm install --global . && \
    npm install pm2 -g && \
    touch /var/log/libroadcast

CMD ["pm2", "logs"]
