FROM node:22-alpine
WORKDIR /app/apps/server
COPY apps/server/package.json ./package.json
RUN npm install --omit=dev
COPY apps/server ./
COPY packages/shared /app/packages/shared
COPY apps/standalone /app/apps/standalone
COPY apps/web/public /app/apps/web/public
COPY database /app/database
EXPOSE 8787
CMD ["node", "src/index.js"]
