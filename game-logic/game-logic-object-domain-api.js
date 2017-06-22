/*jslint node: true */
"use strict";

var gameStateConstants = {
	'IDLE' : 'IDLE',
	'RENDERING' : 'RENDERING',
	'SPIN' : 'SPIN',
	'SPINNING' : 'SPINNING',
	'SPIN_COMPLETE': 'SPIN_COMPLETE',
	'AWARD_WIN': 'AWARD_WIN'
};

var winTypeConstants = {
		'REELS': 'REELS',
		'PROGRESSIVE': 'PROGRESSIVE'
};

exports.getWinTypeConstants = function() {
	return winTypeConstants;
};

exports.getGameStateConstants = function() {
	return gameStateConstants;
};

exports.GameIdentifier = function() {
	var gameIdentifier = {
		'GameUID' : 'EXAMPLE-VIRGO-GAME2',
		'GameName' : 'Example Virgo Slot Game2'
	};

	return gameIdentifier;
};

exports.VirgoWalletType = function() {
	var virgoWalletType = {
		'Identifier' : 'GENERIC-SINGLE-METER',
		'ILLEGAL_CHARACTER_REGEX' : {
			'pattern' : '[^\\dA-Z\\-]+',
			'flags' : 0
		}
	};

	return virgoWalletType;
};

exports.RawJSON = function(rawJSONParams) {
	var rawJSON = {
		'RawJSON' : JSON.stringify(rawJSONParams)
	};

	return rawJSON;
};
/**
 * transactionAmount":{
 "amount":10,
 "currencyCode":"GBP"
 },
 */
exports.TransactionAmount = function(params) {
	return params.TransactionAmount;
};
/**
 *
 *"rawJSON":{"Phase":"IDLE","ReelOffsets":[1,13,6]}},
 *
 *
 *
 */
exports.GameState = function(params) {
	var gameState, stateJSON, progressiveState;
	/*stateJSON = JSON.parse(params.stateJSON.rawJSON);
	console.log(stateJSON);
	if (stateJSON.ProgressiveState) {
		progressiveState = stateJSON.ProgressiveState;
	} else {
		progressiveState = null;
	}
	gameState = {
		'Phase' : stateJSON.Phase,
		'ReelOffsets' : stateJSON.ReelOffsets,
		'ProgressiveState' : progressiveState
	};*/
	gameState = JSON.parse(params.StateJSON.RawJSON);

	return gameState;
};
/**
 * "requestJSON":{
 "rawJSON":{
 "Command":"SPIN"
 }
 },
 */
exports.GameRequest = function(params) {
	console.log(params.RequestJSON.RawJSON);
	return JSON.parse(params.RequestJSON.RawJSON);
};

exports.SpinningGameState = function(phase, reelOffsets, finalReelOffsets,
		prizeAmount, currencyCode, gameProgressiveState) {
	var spinningGameState = {
		'Phase' : phase,
		'ReelOffsets' : reelOffsets,
		'ProgressiveState' : gameProgressiveState,
		'FinalReelOffsets' : finalReelOffsets,
		'PrizeAmount' : prizeAmount,
		'CurrencyCode' : currencyCode
	};
	return spinningGameState;
};

exports.IdleGameState = function(phase, currentGameState) {
	var idleGameState = {
			'Phase': phase,
			'ReelOffsets': currentGameState.FinalReelOffsets,
			'ProgressiveState': currentGameState.ProgressiveState
	};
	return idleGameState;
};

exports.AwardWinGameState = function(phase, currentGameState) {
	var idleGameState = {
			'Phase': phase,
			'ReelOffsets': currentGameState.FinalReelOffsets,
			'ProgressiveState': currentGameState.ProgressiveState
	};
	return idleGameState;
};

exports.Money = function(amount, currencyCode) {
	var money = {
			'Amount': amount,
			'CurrencyCode': currencyCode
	};
	
	return money;
};

exports.Prize = function(winType, moneyAmount, jackpotClaimToken) {
	var prize = {
			'WinType': winType,
			// regarding recent changes we only require numeric amount from constructor
			'MoneyAmount': moneyAmount,
			'JackpotClaimToken': jackpotClaimToken		
	};
	
	return prize;
};