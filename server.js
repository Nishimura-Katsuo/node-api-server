"use strict";
/* globals global require process logDir htmlDocs logger Buffer */

// the ws and compression modules are from npm
// I think express is too?

const cluster = require('cluster');
const url = require('url');
const qs = require('querystring');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const domain = require('domain');
const maxPost = 1e4;

Object.defineProperties(global, {
	logDir: {
		value: '/var/www/node-api/logs',
		writable: false,
	},
	htmlDocs: {
		value: '/var/www/html',
		writable: false,
	},
});

Object.defineProperties(global, {
	require: {
		value: require,
		writable: false,
	},
	logger: {
		value: (() => {
			if (cluster.isMaster) {
				return console;
			}

			let myout;
			let myerr;

			if (process.stdout.isTTY) {
				myout = process.stdout;
				myerr = process.stderr;
			} else {
				if (!fs.existsSync(logDir)) {
					fs.mkdirSync(logDir);
				}

				myout = fs.createWriteStream( logDir + '/CONSOLE', {flags: 'a'});
				myerr = myout;
			}

			return new console.Console(myout, myerr);
		})(),
		writable: false,
	},
});

const scripts = new class {
	constructor () {
		this.watch = {};
	}

	load (file) {
		try {
			file = require.resolve(file);

			if (!this.watch[file]) {
				logger.log('Loading script: ' + file);
				this.watch[file] = fs.watch(file, {persistent: false}, () => {
					try {
						if (require.cache[file]) {
							delete require.cache[file];
						}

						this.watch[file].close();
						delete this.watch[file];
					} catch (err) {
						logger.log(err.stack);
					}
				});
			}

			return require(file);
		} catch (err) {
			logger.log(err.stack);
		}

		return null;
	}
};

function finish (res, code, text) {
	if (text) {
		res.writeHead(code, {'Content-Type': 'text/plain'});
		res.end(text);
	} else {
		res.writeHead(200);
		res.end();
	}
}

function scriptHandler (req, res) {
	let q = url.parse(req.url, true);
	let filepathbase = htmlDocs + decodeURI(q.pathname);
	let postdata = [], postdatalen = 0;

	if (!/\.js$/i.test(filepathbase)) {
		filepathbase += ".js";
	}

	fs.access(filepathbase, fs.constants.R_OK, access_err => {
		if (access_err) {
			return finish(res, 500, "No file access!");
		}

		try {
			let script = scripts.load(filepathbase), scriptInterface;

			if (script) {
				if (typeof script.request === 'function') {
					req.on('data', (chunk) => {
						postdatalen += chunk.length;

						if (postdatalen > maxPost) {
							res.status(413).end();
							res.connection.destroy();
						} else {
							postdata.push(chunk);
						}
					});
					req.on('end', () => {
						new Promise((resolve, reject) => {
							scriptInterface = {
								responseCode: 200,
								headers: {'Content-Type': 'text/plain'},
								setCookie: {},
								getPostData: () => Buffer.concat(postdata).toString(),
								query: q.query,
								method: req.method,
								path: q.pathname,
								resolve: resolve,
								reject: reject,
								cookie: (req.headers.cookie ? qs.parse(req.headers.cookie, ';') : {}),
							};

							script.request(scriptInterface, logger);
						}).then(response => {
							for (let k in scriptInterface.setCookie) {
								res.setHeader('Set-Cookie', qs.escape(k) + "=" + qs.escape(scriptInterface.setCookie[k]));
							}

							res.writeHead(scriptInterface.responseCode, scriptInterface.headers);

							if (response !== undefined && response !== null) {
								res.end(response.toString(), 'binary');
							} else {
								res.end();
							}
						}).catch(err => {
							for (let k in scriptInterface.setCookie) {
								res.setHeader('Set-Cookie', qs.escape(k) + "=" + qs.escape(scriptInterface.setCookie[k]));
							}

							logger.log(`[${process.pid} @ ${new Date().toUTCString()}] ` + err.stack ? err.stack : err.toString());
							res.writeHead(500, scriptInterface.headers);

							if (err !== undefined && err !== null) {
								res.end(err.stack ? err.stack : err.toString(), 'binary');
							} else {
								res.end();
							}
						});
					});
				} else {
					return finish(res, 200, 'API Loaded Successfully!');
				}
			}
		} catch (err) {
			logger.log(err);

			return finish(res, 500, err.toString());
		}
	});
}

function scriptRouter (req, res) {
	let d;

	switch (req.method) {
	case 'GET':
	case 'POST':
	case 'PUT':
	case 'DELETE':
		d = domain.create();
		d.on('error', (err) => {
			res.writeHead(500, {'Content-Type': 'text/plain'});

			if (err) {
				logger.log(`[${process.pid} @ ${new Date().toUTCString()}] ` + err.stack ? err.stack : err.toString());
				res.end(err.stack ? err.stack : err.toString(), 'binary');
			} else {
				res.end('Internal Server Error');
			}
		});
		d.run(() => {
			scriptHandler(req, res);
		});

		break;
	default:
		return;
	}
}

if (cluster.isMaster) { // master code
	console.log('Spawning children...');
	cluster.fork(); // only fork once, this just allows the server to keep itself alive
	cluster.on('exit', (worker /*, code, signal */) => {
		console.log(`[${process.pid} @ ${new Date().toUTCString()}] Child ${worker.process.pid} died!`);
		cluster.fork(); // if server dies fork a new thread
	});
} else { // child code
	logger.log(`[${process.pid} @ ${new Date().toUTCString()}] Starting node API Server`);

	process.on('exit', (code) => {
		logger.log(`[${process.pid} @ ${new Date().toUTCString()}] Exiting with code: ${code}\n`);
	});

	// server setup
	const server = http.createServer(scriptRouter);

	let wss = new WebSocket.Server({ server: server });
	wss.on('connection', (ws, req) => {
		try {
			logger.log(`[${process.pid} @ ${new Date().toUTCString()}][${req.socket.remoteAddress}] ${req.method} ${JSON.stringify(req.headers.host)}${req.url}\t(websocket)`);
			let q = url.parse(req.url, true);
			let filepathbase = htmlDocs + decodeURI(q.pathname);

			if (!/\.js$/i.test(filepathbase)) {
				filepathbase += ".js";
			}

			let script = scripts.load(filepathbase);

			if (script && typeof script.connect === 'function') {
				ws.scriptPath = filepathbase;

				if (script.connect(ws, wss, req)) {
					return;
				}
			}
		} catch (err) {
			logger.log(err);
		}

		ws.terminate();
	});

	server.listen(22345);
}

