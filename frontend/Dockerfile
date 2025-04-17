# Käytä Node.js:ää frontendin rakentamiseen
FROM node:18 AS build

# Aseta työhakemisto
WORKDIR /usr/src/app

# Kopioi ja asenna frontendin riippuvuudet
COPY frontend/package*.json ./
RUN npm install

# Kopioi frontendin lähdekoodi ja rakenna tuotantoversio
COPY frontend/ ./
RUN npm run build

# Käytä Nginxiä tuotantopalvelimena
FROM nginx:alpine

# Kopioi rakennettu frontend Nginxin oletushakemistoon
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Lisää tämä osa
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exposoi portti 8080
EXPOSE 8080

# Käynnistä Nginx
CMD ["nginx", "-g", "daemon off;"]