# Build-Stage / Verwende Node.js als Basis-Image
FROM node:24.14-alpine AS build
WORKDIR /app
# Kopiere package.json und package-lock.json
COPY package*.json ./
# Installiere Abhängigkeiten
RUN npm ci
# Kopiere den restlichen Quellcode
COPY . .

RUN ls -la ./

# Baue die Angular-App
RUN npm run build:production

## Production-Stage / Verwende NGINX als Basis-Image für die Produktionsumgebung
#FROM nginx:alpine AS runner
## Kopiere die gebaute App in das NGINX-Verzeichnis
#COPY --from=build /app/dist/finder /usr/share/nginx/html
## Kopiere deine angepasste NGINX-Konfiguration (optional, aber empfohlen. Eine Beispiel Konfiguration findest du weiter unten)
#COPY nginx.conf /etc/nginx/nginx.conf
## Port 80 freigeben, nginx läuft auf diesem Port
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
