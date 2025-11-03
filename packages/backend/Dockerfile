# Используем облегчённый Node-образ
FROM node:18-alpine

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код
COPY . .

# Сборка TypeScript
RUN npm run build

# Очищаем dev-зависимости, чтобы уменьшить размер
RUN npm prune --production

# Запуск собранного JS
CMD ["node", "dist/server.js"]
