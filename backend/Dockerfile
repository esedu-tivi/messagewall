# Käytä Node.js:ää backendin ajamiseen
FROM node:18

# Aseta työhakemisto
WORKDIR /usr/src/app

# Kopioi ja asenna backendin riippuvuudet
COPY package*.json ./
RUN npm install

# Kopioi backendin lähdekoodi
COPY . .

# Exposoi portti 5000
EXPOSE 5000

# Käynnistä backend
CMD ["npm", "start"]