FROM nginx:stable-alpine

LABEL app=wedding

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY wp-content/ /usr/share/nginx/html/wp-content/

EXPOSE 80
