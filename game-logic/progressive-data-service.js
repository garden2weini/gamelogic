/*jslint node: true */
"use strict";

var GameLogicDomainAPI = require('./game-logic-object-domain-api.js');
var RemoteDataServiceAPI = require('./remote-data-service');
var CommsHUB = require('../comms/comms-hub.js');
var GameLogicAPI = require('./game-logic.js');
var currencies = require('../lib/currency').Currency();
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var progressiveAccessLevel = {
		'CENTRAL': 'CENTRAL_DETERMINATION',
		'LOCAL': 'LOCAL_DETERMINATION'
};
/**
 *	tokenRequired is always true for CENTRAL 
 */
var progressiveDataSource = {
		'CENTRAL': 'CENTRAL',
		'NONE': 'NONE'
};

var progressiveGameEventType = {
		'WIN': 'WIN'
};

//----- requests to virgo
function ProgressiveStatusRequest(gameLogicObject, token, currency) {
	this.RequestToken = token;
	this.Currency = currency;
	this.gameLogicObject = gameLogicObject;
}

function ProgressiveEntryRequest(gameLogicObject, token, stake, jackpotLevelStatuses) {
	this.RequestToken = token;
	this.Stake = stake;
	this.InvolvedJackpots = jackpotLevelStatuses;
	this.gameLogicObject = gameLogicObject;
}

function ProgressiveClaimRequest(gameLogicObject, token, stake, wonJackpotLevelStatus) {
	this.RequestToken = token;
	this.Stake = stake;
	this.ClaimedJackpot = wonJackpotLevelStatus;
	this.gameLogicObject = gameLogicObject;
}
//----- end requests to virgo

function ProgressiveStatus(currencyCode, gameProgressive) {
	var tokenConf = gameProgressive.tokenConf, progressiveStatusRequest, interfaceMethod, urlRest;
	console.log(this);
	progressiveStatusRequest = new ProgressiveStatusRequest(this, tokenConf.Token, currencyCode);
	if(tokenConf.DataSource !== progressiveDataSource.CENTRAL) {
		throw "exception token is not required " + tokenConf.Token;
	} else {
		interfaceMethod = 'getJackpotStatus';
		urlRest = gameProgressive.remoteService.urlRest;
		CommsHUB.sendRequest(progressiveStatusRequest, urlRest, interfaceMethod);
	}
}

function ExplodingGameProgressive(tokenProgressive) {
	EventEmitter.call(this);
	this.tokenConf = tokenProgressive;
	this.getProgressiveStatus = ProgressiveStatus;
}

function ProgressiveDataService(serviceURI) {
	var progressiveDataService = RemoteDataServiceAPI.RestDataService(serviceURI);
	return progressiveDataService;
}

function JackpotWon(jackpotWon, winningToken, determination, type) {
	this.OtherInfo = {};
	this.Type = type;
	this.Content = {
			'JackpotWon': jackpotWon,
			'WinningToken': winningToken
	};
	this.Determination = determination;
}

function JackpotNotWon(determination) {
	this.Determination = determination;
	this.OtherInfo = {};
}

///--- remote interface methods
function ClaimProgressive(progressiveClaimRequest, urlRest) {
	var interfaceMethod = 'claimJackpot'; 
	CommsHUB.sendRequest(progressiveClaimRequest, urlRest, interfaceMethod);
}

function EnterJackpotDraw(progressiveEntryRequest, urlRest) {
	var interfaceMethod = 'enterProgressiveDraw'; 
	CommsHUB.sendRequest(progressiveEntryRequest, urlRest, interfaceMethod);
}

function RecordFailedJackpot(progressiveEntryRequest, urlRest) {
	var interfaceMethod = 'recordFailedJackpot'; 
	CommsHUB.sendRequest(progressiveEntryRequest, urlRest, interfaceMethod);
}
////--- remote interface methods end

function RemoteGameProgressive(tokenProgressive) {
	EventEmitter.call(this);
	var progressiveDataService;
	progressiveDataService = new ProgressiveDataService(tokenProgressive.ServiceUri);
	this.tokenConf = tokenProgressive;
	this.remoteService = progressiveDataService;
	this.getProgressiveStatus = ProgressiveStatus;
	this.enterJackpotDraw = EnterJackpotDraw;
	this.claimProgressive = ClaimProgressive;
	this.recordFailedJackpot = RecordFailedJackpot;
}

function updateJackpotsStatus(gameProgressive, currencyCode) {
	if(gameProgressive.tokenConf.AccessLevel === 'NONE') {
		console.log('Progressive: NONE');
		return null;
	} else {
		gameProgressive.getProgressiveStatus(currencyCode, gameProgressive);
	}
}

function EnterJackpot(gameProgressive, stake, jackpotLevelStatuses) {
	var progressiveEntryRequest = new ProgressiveEntryRequest(gameProgressive, gameProgressive.tokenConf.Token, stake, jackpotLevelStatuses), urlRest = gameProgressive.remoteService.urlRest;	
	gameProgressive.enterJackpotDraw(progressiveEntryRequest, urlRest);
}

function ClaimJackpot(gameProgressive, stake, jackpotLevelStatus) {
	var progressiveClaimRequest = new ProgressiveClaimRequest(gameProgressive, gameProgressive.tokenConf.Token, stake, jackpotLevelStatus), urlRest = gameProgressive.remoteService.urlRest;
	gameProgressive.claimProgressive(progressiveClaimRequest, urlRest);
}

function RecordFailed(gameProgressive, stake, jackpotLevelStatuses) {
	var progressiveEntryRequest = new ProgressiveEntryRequest(gameProgressive, gameProgressive.tokenConf.Token, stake, jackpotLevelStatuses), urlRest = gameProgressive.remoteService.urlRest;	
	gameProgressive.recordFailedJackpot(progressiveEntryRequest, urlRest);
}

function ProgressiveGameState(jackpotsStatus, jackpotGameEvents) {
	this.JackpotsStatus = jackpotsStatus;
	this.JackpotGameEvents = jackpotGameEvents;
	this.OtherProperties = {};
	this.updateJackpotsStatus = updateJackpotsStatus;
	this.enterJackpot = EnterJackpot;
	this.claimJackpot = ClaimJackpot;
	this.recordFailed = RecordFailed;
}

function formatJackpotAmount(jackpotAmount){
	var formattedJackpotAmount = jackpotAmount.toString();
	while(formattedJackpotAmount.length < 3){
		formattedJackpotAmount = "0"+formattedJackpotAmount;
	}
	return formattedJackpotAmount.substring(0, formattedJackpotAmount.length-2)+"."+formattedJackpotAmount.substring(formattedJackpotAmount.length-2);
}

////----adding jackpot level statuses to new progressive state
function addEmptyJackpotLevelStatusToProgressiveGameState(progressiveGameState) {
	progressiveGameState.OtherProperties['levelName'] = 'progressive';
	progressiveGameState.OtherProperties['amount'] = 'NA';
		
}

function addJackpotLevelStatusToProgressiveGameState(newProgressiveGameState, jackpotLevelStatuses) {
	var jackpotLevelStatus = jackpotLevelStatuses[0];
	if(jackpotLevelStatus) {
		console.log('--------------JACKPOT:'+JSON.stringify(jackpotLevelStatuses, null, '/t'));
		newProgressiveGameState.JackpotsStatus = jackpotLevelStatuses;
	}
}
//////---- end adding jackpot level statuses to new progressive state

function addJackpotUINotificationToProgressiveState(newProgressiveGameState, jackpotGameEvent) {
	var jackpotStatuses, uiJackpotNotification = "", jackpotWon, jackpotStatus, i;
	
	jackpotStatuses = newProgressiveGameState.JackpotsStatus;
	// this checks jackpot that has been won and add 'jackpot' property which is used to display splash screen
	
	if(jackpotGameEvent.jackpot instanceof JackpotWon) {
		console.log("==========================JACKPOT WON %s", JSON.stringify(jackpotGameEvent));
		jackpotWon = jackpotGameEvent.jackpot.Content.JackpotWon;
		uiJackpotNotification += jackpotWon.LevelName;
		uiJackpotNotification += " ";
		uiJackpotNotification += formatJackpotAmount(jackpotWon.Value.Amount);
		uiJackpotNotification += " ";
		uiJackpotNotification += currencies[jackpotWon.Value.CurrencyCode].symbol;
		newProgressiveGameState.OtherProperties['jackpot'] = uiJackpotNotification;
	}	
	// these properties are used just to show list of active jackpots 
	newProgressiveGameState.OtherProperties['levelName'] = '';
	newProgressiveGameState.OtherProperties['amount'] = '';	
		
	jackpotStatus = jackpotStatuses[0];
	
	newProgressiveGameState.OtherProperties['levelName'] += jackpotStatus.LevelName;
	newProgressiveGameState.OtherProperties['amount'] += formatJackpotAmount(jackpotStatus.Value.Amount)+currencies[jackpotStatus.Value.CurrencyCode].symbol;
			
}

function callProgressiveJackpot(progressiveGameState, stake, gameProgressive) {
	console.log('callProgressiveJackpotMethod:'+JSON.stringify(progressiveGameState, null, '/t'));
	if(progressiveGameState.JackpotsStatus && progressiveGameState.JackpotsStatus.length > 0) {
		if(gameProgressive.tokenConf.AccessLevel === progressiveAccessLevel.CENTRAL) {
			console.log('Enter jackpot');
			progressiveGameState.enterJackpot(gameProgressive, stake, null);
		} else if(gameProgressive.tokenConf.AccessLevel === progressiveAccessLevel.LOCAL) {
			if(Math.random() < 0.3) {
				console.log('Claim jackpot');
				progressiveGameState.claimJackpot(gameProgressive, stake, progressiveGameState.JackpotsStatus[0]);
			}
			else {
				console.log('Record failed');
				progressiveGameState.recordFailed(gameProgressive, stake, null);
			}			
		}
	} else {
		return null;
	}
}

function JackpotGameEvent(progressiveCallResponseResult, progressiveAccessLevel) {
	var jackpotWon, jackpotNotWon, progressiveResponseWin;
	if(progressiveCallResponseResult.Win) {
		 progressiveResponseWin = progressiveCallResponseResult.Win;
		jackpotWon = new JackpotWon(progressiveResponseWin.Jackpot, progressiveResponseWin.ClaimToken, progressiveAccessLevel, progressiveGameEventType.WIN);
		this.jackpot = jackpotWon; 
	}
	else {
		jackpotNotWon = new JackpotNotWon(progressiveAccessLevel);
		this.jackpot = jackpotNotWon; 
	}
	
}

function getGameRandomForGame(gameRandom, gameProgressive, newProgressiveGameState, currencyCode, reelOffsets) {
	var receivedData, prizeAmount, finalReelOffsets, spinningGameState;
	gameRandom.on('getRandomNumberJsonRpc2ResponseReceived', function(responseBody){
		var result, jsonRpc2ResponseJSON = JSON.parse(responseBody);
		console.log("getRandomNumberJsonRpc2ResponseReceived");
		receivedData = jsonRpc2ResponseJSON.result.Data;
		finalReelOffsets = GameLogicAPI.generateRandomReelOffsetsAfterRandomNumberReceived(receivedData);				
		result = GameLogicAPI.CalculatePrizeAmountForReelOffsets(finalReelOffsets);
		prizeAmount = result.prize;
			
		spinningGameState = GameLogicDomainAPI.SpinningGameState(GameLogicDomainAPI.getGameStateConstants().SPINNING, reelOffsets, finalReelOffsets, prizeAmount, currencyCode, newProgressiveGameState);
		console.log('Spinning game state:'+JSON.stringify(spinningGameState, null, '/t'));
		gameProgressive.emit('gameLogicProcessingComplete', spinningGameState, result);
	});
	
	GameLogicAPI.generateRandomReelOffsets(gameRandom);
} 

function registerEventsForProgressiveCallToVirgo(gameRandom, gameProgressive, newProgressiveGameState, gameState, stake) {
	// no progressive levels defined, list from Virgo is empty
	var jackpotGameEvent, receivedResponseResult, progressiveAttemptResponse;
	if(callProgressiveJackpot(newProgressiveGameState, stake, gameProgressive) === null) {
		addEmptyJackpotLevelStatusToProgressiveGameState(newProgressiveGameState);
		getGameRandomForGame(gameRandom, gameProgressive, newProgressiveGameState, stake.CurrencyCode, gameState.ReelOffsets);
	}
	
	gameProgressive.on('claimJackpotJsonRpc2ResponseReceived', function(responseBody){
		progressiveAttemptResponse = JSON.parse(responseBody);
		receivedResponseResult = progressiveAttemptResponse.result;
		
		console.log('claimJackpotJsonRpc2ResponseReceived:'+JSON.stringify(progressiveAttemptResponse, null, '/t'));
		jackpotGameEvent = new JackpotGameEvent(receivedResponseResult, progressiveAccessLevel.LOCAL);
		
		newProgressiveGameState.JackpotGameEvents.push(jackpotGameEvent.jackpot);
		addJackpotUINotificationToProgressiveState(newProgressiveGameState, jackpotGameEvent);
		console.log('claimJackpotJsonRpc2ResponseReceived:'+JSON.stringify(newProgressiveGameState, null, '/t'));
		getGameRandomForGame(gameRandom, gameProgressive, newProgressiveGameState, stake.CurrencyCode, gameState.ReelOffsets);			
	});
	
	gameProgressive.on('enterProgressiveDrawJsonRpc2ResponseReceived', function(responseBody){
		progressiveAttemptResponse = JSON.parse(responseBody);
		receivedResponseResult = progressiveAttemptResponse.result;
		
		console.log('enterJackpotDrawJsonRpc2ResponseReceived:'+JSON.stringify(progressiveAttemptResponse, null, '/t'));
		jackpotGameEvent = new JackpotGameEvent(receivedResponseResult, progressiveAccessLevel.CENTRAL);
		newProgressiveGameState.JackpotGameEvents.push(jackpotGameEvent.jackpot);
		addJackpotUINotificationToProgressiveState(newProgressiveGameState, jackpotGameEvent);
		console.log('enterProgressiveDrawJsonRpc2ResponseReceived:'+JSON.stringify(newProgressiveGameState, null, '/t'));
		getGameRandomForGame(gameRandom, gameProgressive, newProgressiveGameState, stake.CurrencyCode, gameState.ReelOffsets);
	});
	
	// record failed is a send and forget call. Virgo will send empty response
	gameProgressive.on('recordFailedJackpotJsonRpc2ResponseReceived', function(responseBody){
		receivedResponseResult = {};
		console.log('recordFailedJackpotJsonRpc2ResponseReceived:'+JSON.stringify(progressiveAttemptResponse, null, '/t'));
		jackpotGameEvent = new JackpotGameEvent(receivedResponseResult, progressiveAccessLevel.LOCAL);
		newProgressiveGameState.JackpotGameEvents.push(jackpotGameEvent.jackpot);
		addJackpotUINotificationToProgressiveState(newProgressiveGameState, jackpotGameEvent);
		console.log('recordFailedJackpotJsonRpc2ResponseReceived:'+JSON.stringify(newProgressiveGameState, null, '/t'));
		getGameRandomForGame(gameRandom, gameProgressive, newProgressiveGameState, stake.CurrencyCode, gameState.ReelOffsets);
	});
}

util.inherits(RemoteGameProgressive, EventEmitter);
util.inherits(ExplodingGameProgressive, EventEmitter);

exports.GameProgressive = function(dataRetrievalContext) {
	var gameProgressive, tokenProgressive, dataSourceProgressive;

	tokenProgressive = dataRetrievalContext.tokenProgressive;
	dataSourceProgressive = RemoteDataServiceAPI.DataSource(tokenProgressive.dataSource);
	
	switch(dataSourceProgressive.dataSource) {
		case 'NONE':
			gameProgressive = new ExplodingGameProgressive(tokenProgressive);
			break;
		default:
			gameProgressive = new RemoteGameProgressive(tokenProgressive);
			break;
	}
	
	return gameProgressive;
};

exports.GetProgressiveGameState = function(stake, gameState, gameRequest, gameRandom, gameProgressive) {
	var newProgressiveGameState, jackpotGameEvents = [], jackpotLevelStatuses = [];
	newProgressiveGameState = new ProgressiveGameState(jackpotLevelStatuses, jackpotGameEvents);
	
	return newProgressiveGameState;
};

//quite a big function, lots of things is done to ProgressiveGameState
exports.AddJackpotLevelStatuses = function(newProgressiveGameState, stake, gameState, gameRequest, gameRandom, gameProgressive) {
	var jackpotLevelStatuses, receivedResponseResult;
	
	gameProgressive.on('getJackpotStatusJsonRpc2ResponseReceived', function(responseBody){		
		console.log('getJackpotStatusJsonRpc2ResponseReceived:'+responseBody);
		receivedResponseResult = JSON.parse(responseBody);
		jackpotLevelStatuses = receivedResponseResult.result.JackpotList;
		
		addJackpotLevelStatusToProgressiveGameState(newProgressiveGameState, jackpotLevelStatuses);			
		registerEventsForProgressiveCallToVirgo(gameRandom, gameProgressive, newProgressiveGameState, gameState, stake);
	});
	
	console.log('update jackpot status');
	if(newProgressiveGameState.updateJackpotsStatus(gameProgressive, stake.CurrencyCode) === null) {
		addEmptyJackpotLevelStatusToProgressiveGameState(newProgressiveGameState);
		getGameRandomForGame(gameRandom, gameProgressive, newProgressiveGameState, stake.CurrencyCode, gameState.ReelOffsets);
	}	
};