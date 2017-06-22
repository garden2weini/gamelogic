/*jslint node: true */

"use strict";

/**
 * Entry point for NodeJS server
 */
var CommsHub = require('./comms/comms-hub.js');
var http = require('http');
var url = require('url');

var port = process.argv.slice(2)[0].split('=')[1];

function initHttpServer() {
	function requestListener(request, response) {
		var requestPath = url.parse(request.url).pathname;
		if(request.method === 'POST') {
			CommsHub.receiveRequest(request, response);
		}
	}

	http.createServer(requestListener).listen(port, function() {
		console.log('Server running at http://localhost:' + port );
	});
}

initHttpServer();
