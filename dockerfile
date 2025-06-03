FROM node:16-alpine3.15 AS ng-builder
RUN mkdir -p /app
WORKDIR /app
COPY . /app
RUN npm install -g npm@8.5.5 --force
RUN npm install --legacy-peer-deps --force
RUN $(npm bin)/ng build --prod=true --output-hashing=all --output-path /app/dist/publish/ --base-href /admin/

FROM nginx
EXPOSE 80
EXPOSE 443
COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY --from=ng-builder /app/dist/publish /usr/share/nginx/html

CMD ["/bin/sh",  "-c",  "envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]