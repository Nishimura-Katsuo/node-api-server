'use strict'; /* global module */
let msg = 'Init time: ' + new Date();

let responseGenerator = function (query, isWebSocket) {
	query.msg = msg;
	query.isWebSocket = isWebSocket;

	return JSON.stringify(query);
};

module.exports.connect = function () { // websocket connection, ws is the socket, wss is socket server (so you can check stuff and send messages to all clients connected)
	this.on('message', data => this.send(responseGenerator(data ? JSON.parse(data) : {}, true)));

	return true; // I don't remember why I return true, lol
};

module.exports.request = function () { // normal http/https request
	// see server.js for things available in the script object
	return responseGenerator(this.query, false);
};
