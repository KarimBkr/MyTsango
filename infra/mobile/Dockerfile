# Dockerfile pour l'application mobile Expo
FROM node:18-alpine

# Installe les dépendances globales nécessaires (expo-cli)
RUN npm install -g expo-cli

WORKDIR /app

# Copier les fichiers de dépendances de l'app mobile
COPY apps/mobile/package.json apps/mobile/package-lock.json ./
RUN npm install

# Copier le code de l'application mobile
COPY apps/mobile/. .

# Expose les ports Expo par défaut (Metro bundler, DevTools, etc.)
EXPOSE 19000 19001 19002

# Commande de démarrage de l'application Expo en mode tunnel (accessible depuis n'importe où via les serveurs Expo)
CMD ["expo", "start", "--tunnel"]
