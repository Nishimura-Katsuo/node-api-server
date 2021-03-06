# Node API Server
A basic Node.js API server for use as a reverse proxy target.

Example nginx configuration for the reverse proxy:

	location /api {
		proxy_pass http://localhost:22345;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}

If you wish to run this as a docker image use this command:

	docker run -d --restart unless-stopped -p 22345:22345 -v /path/to/your/htdocs:/var/www/html nishimurakatsuo/node-api-server

Or if you want it as a standalone API server then change the port to 80:

	docker run -d --restart unless-stopped -p 80:22345 -v /path/to/your/htdocs:/var/www/html nishimurakatsuo/node-api-server
