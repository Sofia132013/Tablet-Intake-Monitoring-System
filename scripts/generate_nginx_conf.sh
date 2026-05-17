#!/bin/bash

cd $(cd "$(dirname "${BASH_SOURCE[0]}")"; pwd -P)
sed -rn "s/^([^#].*)=(.*)/\1='\2'/p" ../.env | { while read string
do
    export $string
done
envsubst '$$REPLICA1_OPEN_SERVER_PORT_MAPPING $$REPLICA2_OPEN_SERVER_PORT_MAPPING
          $$REPLICA3_OPEN_SERVER_PORT_MAPPING $$NGINX_OPEN_HTTPS_PORT $$NGINX_OPEN_HTTP_PORT $$SERVER_IP' \
         < ../backend/nginx/nginx.template \
         > results/nginx.conf
}