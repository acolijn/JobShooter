FROM node:20-alpine
WORKDIR /app
COPY index.mjs ./index.mjs
ENV PORT=3001
ENV DATA_FILE=/data/scores.json
EXPOSE 3001
VOLUME ["/data"]
CMD ["node", "index.mjs"]
