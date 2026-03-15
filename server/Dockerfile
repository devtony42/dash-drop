FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Prisma schema will be generated at runtime from schema.config.json

EXPOSE 3001

CMD ["sh", "entrypoint.sh"]
