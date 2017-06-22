/*jslint node: true */

"use strict";
var LatePayGameLogicService = require('../game-logic/late-pay-game-logic-service.js');
var UUID = require('node-uuid');

function getRequestParams(requestJSON) {
	var params = {};
	
	return params;
}

exports.validateRequestJSON = function (requestJSON) {
	if(!requestJSON.method) {
		throw "no method in request JSON";
	} else if(!requestJSON.id) {
		throw "no request id in request JSON";
	} else if(!requestJSON.jsonrpc) {
		throw "no json rpc2 version in request JSON";
	} 
};

exports.getGameLogicMethodResponse = function(requestJSON, response) {
	var method = requestJSON.method, requestParams = requestJSON.params, requestId = requestJSON.id, rpc2Version = requestJSON.jsonrpc, rpc2MethodConstants = LatePayGameLogicService.getConstants().rpc2Methods;
	console.log(method, requestId, rpc2Version);
	
	switch(method) {
		case rpc2MethodConstants.walletType:
			LatePayGameLogicService.getVirgoWalletType(response);
			break;
		case rpc2MethodConstants.getGameIdentifier:
			LatePayGameLogicService.getGameIdentifier(response);
			break;
		case rpc2MethodConstants.getJsonRPC2Version:
			LatePayGameLogicService.getVirgoRemoteApiVersion(response);
			break;
		case rpc2MethodConstants.getVirginState:
			LatePayGameLogicService.getVirginGameState(requestParams, response);
			break;
		case rpc2MethodConstants.getGameType:
			LatePayGameLogicService.getGameType(response);
			break;
		case rpc2MethodConstants.latePayStartGame:
			LatePayGameLogicService.latePayStartGame(requestParams, response);
			break;
		case rpc2MethodConstants.latePayEndGame:
			LatePayGameLogicService.latePayEndGame(requestParams, response);
			break;
		case rpc2MethodConstants.latePayAwardWinnings:
			LatePayGameLogicService.latePayAwardWinnings(requestParams, response);
			break;
		case rpc2MethodConstants.latePayGamble:
			LatePayGameLogicService.latePayGamble(requestParams, response);
			break;
		case rpc2MethodConstants.recallGameHistory:
			LatePayGameLogicService.recallGameHistory(requestParams, response);
			break;
		default:
			break;
	}
}; 

exports.JSONRpc2Response = function(requestJSON, gameLogicResponseJSON) {
	var response = {
			'jsonrpc': requestJSON.jsonrpc,
			'id': requestJSON.id,
			'result': gameLogicResponseJSON
	};
	return response;
};

exports.JSONRpc2Request = function(gameLogicRequestJSON, interfaceMethod) {
	var request = {
			'params': gameLogicRequestJSON,
			'jsonrpc': '2.0',
			'id': UUID.v1(),
			'method': interfaceMethod
	};
	console.log('JSONRPC2REQUEST:'+JSON.stringify(request));
	return request;
};