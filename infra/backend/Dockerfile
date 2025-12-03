# ------------------------
# Dockerfile multi-stage pour l'API NestJS
# ------------------------

# Étape 1 : build (compilation de l'application NestJS)
FROM node:18-alpine AS builder

# Crée un dossier app et copie les fichiers de configuration et dépendances
WORKDIR /app
COPY services/api/package.json services/api/package-lock.json ./ 
# Si vous utilisez yarn, remplacez par yarn.lock. Ici on suppose npm.
RUN npm install         # Installe toutes les dépendances (dev + prod)

# Copie le code source NestJS
COPY services/api/. .

# Compile le code TypeScript en JavaScript
RUN npm run build       # équivalent: nest build -> génère le dossier dist/

# Optionnel: on peut réduire la taille en supprimant les dépendances dev
RUN npm prune --omit=dev

# Étape 2 : image de production (exécute le code compilé avec seulement les dépendances nécessaires)
FROM node:18-alpine AS runner

WORKDIR /app
# Copie uniquement les fichiers nécessaires depuis l'image builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Définit l'environnement NODE_ENV en production pour des optimisations éventuelles
ENV NODE_ENV=production

# Expose le port de l'application (Nest écoute sur 3000)
EXPOSE 3000

# Commande de lancement de l'API NestJS
CMD ["node", "dist/main.js"]
