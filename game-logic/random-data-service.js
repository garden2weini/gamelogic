/*jslint node: true*/
"use strict";

var RemoteDataServiceAPI = require('./remote-data-service.js');
var CommsHUB = require('../comms/comms-hub.js');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function RandomNumbersRequest(gameLogicObject, requestToken, count, upperBound) {
	this.Count = count;
	this.UpperBound = upperBound;
	this.RequestToken = requestToken;
	this.gameLogicObject = gameLogicObject;
}

function RemoteRandomDataService(serviceURI) {
	var remoteRandomDataService = RemoteDataServiceAPI.RestDataService(serviceURI);
	return remoteRandomDataService;
}

function ExplodingGameRandom() {
	EventEmitter.call(this); // call方法使得MExplodingGameRandom对象继承了EventEmitter对象上的方法
	
	this.token = 'INVALID';
	this.acceptingRequests = true;
}

/**
 * method: getRandomNumer
 * @param randomDataRequest
 * @param urlRest
 * @returns
 */
function fulfilNumber(randomDataRequest, urlRest) {
	var interfaceMethodName;
	interfaceMethodName = 'getRandomNumber';
	CommsHUB.sendRequest(randomDataRequest, urlRest, interfaceMethodName);
}

// not used for now
/*function getRandomNumbers(token, urlRest, count, upperBound) {
	var randomNumbers, randomNumbersRequest;
	randomNumbersRequest = new RandomNumbersRequest(token, count, upperBound);
	fulfilNumber(randomNumbersRequest, urlRest);
}*/

function RandomNumber(token, urlRest, cumulativeReelBandLengthProduct) {
	var randomNumbers, randomNumbersRequest, data, randomNumber;
	randomNumbersRequest = new RandomNumbersRequest(this, token, 1, cumulativeReelBandLengthProduct);
	randomNumber = fulfilNumber(randomNumbersRequest, urlRest);
	
	return randomNumber;
}

// internal object
function RemoteGameRandom(token, serviceURI) {	
	EventEmitter.call(this);
	var remoteRandomDataService;
	remoteRandomDataService = new RemoteRandomDataService(serviceURI);
	
	this.remoteService = remoteRandomDataService;
	this.token = token;
	this.acceptingRequests = true;
	this.getRandomNumber = RandomNumber;
}

util.inherits(RemoteGameRandom, EventEmitter); // 使这个类继承EventEmitter
util.inherits(ExplodingGameRandom, EventEmitter); // 使这个类继承EventEmitter

exports.GameRandom = function(dataRetrievalContext) {
	var dataSourceRandom, tokenRandom, gameRandom, token, serviceURI;
	
	tokenRandom = dataRetrievalContext.tokenRandom;
	dataSourceRandom = RemoteDataServiceAPI.DataSource(tokenRandom.DataSource);
	token = tokenRandom.Token;
	serviceURI = tokenRandom.ServiceUri;
	
	switch(dataSourceRandom.dataSource) {
		case 'NONE':
			gameRandom = new ExplodingGameRandom();
			break;
		case 'CENTRAL':
			gameRandom = new RemoteGameRandom(token, serviceURI);
			break;
		default:
			break;
	}
	
	return gameRandom;
};
