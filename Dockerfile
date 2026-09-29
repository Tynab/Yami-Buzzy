FROM nginx:stable-alpine

LABEL app=wedding

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY wp-content/ /usr/share/nginx/html/wp-content/
COPY wp-includes/ /usr/share/nginx/html/wp-includes/

EXPOSE 80
