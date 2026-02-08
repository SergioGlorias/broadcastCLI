FROM node:24-trixie-slim

WORKDIR /app

COPY . /app

RUN npm install --global pnpm && \
    pnpm install && \
    pnpm build && \
    npm install --global . && \
    touch /var/log/libroadcast

CMD ["tail", "-f", "/var/log/libroadcast"]
