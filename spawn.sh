#!/bin/bash
docker run -d --restart unless-stopped -p 22345:22345 -v /var/www/html:/var/www/html -v /home/git:/home/git nishimurakatsuo/node-api-server

