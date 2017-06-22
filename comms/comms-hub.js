/*jslint node: true */

"use strict";

var CommsAPI = require('./comms-api');
var http = require('http');
var url = require('url');


function sendResponse(response, responseJSON) {
	var responseString = JSON.stringify(responseJSON);
	console.log("Response string:" + responseString);
	response.writeHeader(200, {
		"Content-Type" : "application/json",
		'Content-Encoding': 'gzip'
	});
	response.write(responseString);
	response.end();
}

function prepareResponse(requestJSON, gameLogicResponseJSON) {

}

exports.receiveRequest = function(request, response) {
	var requestBody = '', requestJSON;
	request.setEncoding('utf-8');
	request.on('data', function(chunk) {
		requestBody += chunk;
	});

	request.on('end', function() {
		try {
			console.log("Request data:" + requestBody);
			requestJSON = JSON.parse(requestBody);

			CommsAPI.validateRequestJSON(requestJSON);
			CommsAPI.getGameLogicMethodResponse(requestJSON, response);
		} catch (exc) {
			console.log(exc);
			// TODO: maybe write back to response;
		}
	});

	/**
	 * listens for event emitted by response object once game logic completes
	 * events is emitted from game logic service functions this is needed so
	 * that if we call Virgo we can get response back, process it and write to
	 * client response
	 */
	response.on('gameLogicResponseReady', function(gameLogicResponseJSON) {
		var responseJSON = CommsAPI.JSONRpc2Response(requestJSON, gameLogicResponseJSON);
		sendResponse(response, responseJSON);
	});

};

function receiveResponse(response, gameLogicObject, interfaceMethodName) {
	response.setEncoding('utf8');
	var responseBody = '';
	response.on('data', function(chunk) {
		responseBody += chunk;
	});

	response.on('end', function() {
		console.log('Virgo SDK response:' + responseBody);
		// instead of parsing response here we just pass it back to the event handler function and let it deal with it
		gameLogicObject.emit(interfaceMethodName+'JsonRpc2ResponseReceived', responseBody);
	});
}

// TODO: event to notify game logic that response has been received
exports.sendRequest = function(requestData, requestUrl, interfaceMethodName) {
	var requestDataJSON = CommsAPI.JSONRpc2Request(requestData, interfaceMethodName), options, urlObj = url.parse(requestUrl), req;
	options = {
		host : urlObj.hostname || urlObj.hostName,
		port : urlObj.port,
		path : urlObj.path,
		method : 'POST',
		headers : {
			'Content-Type' : 'application/json',
			'Content-Length' : Buffer.byteLength(JSON.stringify(requestDataJSON)),
			'Accept-Encoding': 'gzip, deflate'
		}
	};
	
	req = http.request(options, function(response) {
		receiveResponse(response, requestData.gameLogicObject, interfaceMethodName);
	});

	req.write(JSON.stringify(requestDataJSON));
	req.end();
};
