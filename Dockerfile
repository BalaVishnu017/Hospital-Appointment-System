FROM node:22.23.2-bookworm-slim
ENV NODE_ENV=production PORT=3001 HOST=0.0.0.0 DB_PATH=/data/hospital.sqlite
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force && mkdir -p /data && chown node:node /data
COPY --chown=node:node index.js database.js ./
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node public ./public
USER node
EXPOSE 3001
CMD ["node", "index.js"]
