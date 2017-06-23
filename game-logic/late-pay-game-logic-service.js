/*jslint node: true */
"use strict";

//var ResponsesAPI = require('./responses-api.js');
var GameLogicDomainAPI = require('./game-logic-object-domain-api.js');
var RemoteDataServiceAPI = require('./remote-data-service');
var RandomDataServiceAPI = require('./random-data-service.js');
var ProgressiveDataServiceAPI = require('./progressive-data-service.js');
var GameLogicAPI = require('./game-logic.js');
var GameLogicResponseObjectsDomainAPI = require('./game-logic-responses-domain-api.js');

/**
 * any object doing JSON-RPC 2 request/response from/tp virgo will need to be
 * EventEmitter subclasses. like GameRandom in random-data-service
 */

var constants = {
		rpc2Methods : {
			latePayStartGame : "LATE_PAY_START_GAME",
			latePayEndGame : "LATE_PAY_END_GAME",
			latePayGamble : "LATE_PAY_GAMBLE",
			latePayContinueGame : "LATE_PAY_CONTINUE_GAME",
			latePayAwardWinnings : "LATE_PAY_AWARD_WIN",
			refreshProgressive : "REFRESH_PROGRESSIVE",
			walletType : "VIRGO_WALLET_TYPE",
			getVirginState : "GET_VIRGIN_STATE",
			getGameType : "VIRGO_GAME_TYPE",
			getGameIdentifier : "VIRGO_GAME_IDENTIFIER",
			getJsonRPC2Version : "VIRGO_REMOTE_API_VERSION",
			recallGameHistory: "VIRGO_SLOT_GAME_RECALL_HISTORY"
		}
};

exports.getConstants = function() {
	return constants;
};

exports.latePayStartGame = function(requestParams, response) {
	var dataRetrievalContext, gameRandom, gameProgressive, dataRetrievalContextJSON, stake, gameState, gameRequest, rawMutatedGameStateJSON, newProgressiveGameState, slotGameLogicResponse;
	dataRetrievalContextJSON = requestParams.DataRetrievalContext;
	console.log('START GAME SERVICE REQUEST PARAMS:' + JSON.stringify(requestParams, null, '/t'));
	if (requestParams) {
		dataRetrievalContext = RemoteDataServiceAPI.DataRetrievalContext(dataRetrievalContextJSON.TokenRandom, dataRetrievalContextJSON.TokenProgressive);
		// 生成一个用于获取Random的对象
		gameRandom = RandomDataServiceAPI.GameRandom(dataRetrievalContext);
		// 生成一个用于获取Progressive的对象
		gameProgressive = ProgressiveDataServiceAPI.GameProgressive(dataRetrievalContext);

		// Get stake from request object
		stake = GameLogicDomainAPI.TransactionAmount(requestParams);
		// Get gameState from request.
		// {"Phase":"IDLE","ReelOffsets":[6,6,12],"ProgressiveState":{"JackpotsStatus":[{"Id":5,"Value":{"Amount":10000026,"CurrencyCode":"GBP"},"LevelName":"progressive","LevelIndex":1,"Type":"WIDE"}],"JackpotGameEvents":[{"Determination":"LOCAL_DETERMINATION","OtherInfo":{}}],"OtherProperties":{"levelName":"progressive","amount":"100000.26£"}}}
        // {"Command":"SPIN"}
		gameState = GameLogicDomainAPI.GameState(requestParams);
		console.log("(Merlin...)latePayStartGame-gameState:" + JSON.stringify(gameState));
		gameRequest = GameLogicDomainAPI.GameRequest(requestParams);
		// Valid: GameState=IDLE, gameRequestCommand=SPIN
		GameLogicAPI.validateStartGameParameters(gameRequest.Command, stake.Amount, gameState.Phase);
		// Build a ProgressiveGameState to deal with pgs later.
		newProgressiveGameState = ProgressiveDataServiceAPI.GetProgressiveGameState(stake, gameState, gameRequest,gameRandom, gameProgressive);
		ProgressiveDataServiceAPI.AddJackpotLevelStatuses(newProgressiveGameState, stake, gameState, gameRequest, gameRandom, gameProgressive);

		gameProgressive.on('gameLogicProcessingComplete', function(gameLogicStateResponseJSON, result) {
			var reelOffsets;
			reelOffsets = gameLogicStateResponseJSON.FinalReelOffsets;
			
			rawMutatedGameStateJSON = GameLogicDomainAPI.RawJSON(gameLogicStateResponseJSON);
			slotGameLogicResponse = GameLogicResponseObjectsDomainAPI.SlotGameLogicResponse(rawMutatedGameStateJSON, 92.0, result.symbols, result.winLines, 0, reelOffsets);
			response.emit('gameLogicResponseReady', slotGameLogicResponse);
		});
	}
};

exports.latePayEndGame = function(requestParams, response) {
	var gameState, gameRequest, idleGameState, prizes = [], moneyAmount, prize, jackpotPrize, jackpotGameEvents, i, jackpotWon, gameProgressiveState, slotGameStateAndPrizeResponse, rawMutatedGameStateJSON;
	console.log('END GAME SERVICE REQUEST PARAMS:' + JSON.stringify(requestParams, null, '/t'));
	if (requestParams) {
		gameRequest = GameLogicDomainAPI.GameRequest(requestParams);
		gameState = GameLogicDomainAPI.GameState(requestParams);

		if(gameRequest.Command !== GameLogicDomainAPI.getGameStateConstants().SPIN_COMPLETE) {
			throw 'Command did not equal SPIN_COMPLETE!';
		}

		if(gameState.Phase !== GameLogicDomainAPI.getGameStateConstants().SPINNING) {
			throw 'Incorrect phase to call end game!';
		}

		idleGameState = GameLogicDomainAPI.IdleGameState(GameLogicDomainAPI.getGameStateConstants().IDLE, gameState);		
		/* DEPRECATED
		 * money = GameLogicDomainAPI.Money(gameState.PrizeAmount, gameState.CurrencyCode);
		 */
		moneyAmount = gameState.PrizeAmount;
		prize = GameLogicDomainAPI.Prize(GameLogicDomainAPI.getWinTypeConstants().REELS, moneyAmount, null);
		prizes.push(prize);

		gameProgressiveState = gameState.ProgressiveState;
		if (gameProgressiveState) {
			jackpotGameEvents = gameProgressiveState.JackpotGameEvents;
			for (i = 0; i < jackpotGameEvents.length; i += 1) {
				if(jackpotGameEvents[i].Content && jackpotGameEvents[i].Content.JackpotWon) {
					jackpotWon = jackpotGameEvents[i].Content.JackpotWon;
					/* DEPRECATED
					 * money = GameLogicDomainAPI.Money(jackpotWon.Value.Amount,
							jackpotWon.Value.CurrencyCode);
					*/		
					moneyAmount = jackpotWon.Value.Amount;
					jackpotPrize = GameLogicDomainAPI.Prize(GameLogicDomainAPI
							.getWinTypeConstants().PROGRESSIVE, moneyAmount,
							jackpotGameEvents[i].Content.WinningToken);
					prizes.push(jackpotPrize);
				}
			}
		}
		
		rawMutatedGameStateJSON = GameLogicDomainAPI.RawJSON(idleGameState);
		slotGameStateAndPrizeResponse = GameLogicResponseObjectsDomainAPI.SlotGameStateAndPrizeResponse(rawMutatedGameStateJSON, prizes);

		response.emit('gameLogicResponseReady', slotGameStateAndPrizeResponse);
	}
};

exports.continueGame = function() {

};

exports.latePayGamble = function(requestParams, response) {
	var dataRetrievalContext, gameRandom, gameProgressive, dataRetrievalContextJSON, stake, gameState, gameRequest, rawMutatedGameStateJSON, newProgressiveGameState, slotGameLogicResponse;
	dataRetrievalContextJSON = requestParams.DataRetrievalContext;
	console.log('GAMBLE SERVICE REQUEST PARAMS:' + JSON.stringify(requestParams, null, '/t'));
	if (requestParams) {
		dataRetrievalContext = RemoteDataServiceAPI.DataRetrievalContext(
				dataRetrievalContextJSON.TokenRandom,
				dataRetrievalContextJSON.TokenProgressive);
		gameRandom = RandomDataServiceAPI.GameRandom(dataRetrievalContext);
		gameProgressive = ProgressiveDataServiceAPI.GameProgressive(dataRetrievalContext);

		stake = GameLogicDomainAPI.TransactionAmount(requestParams);
		gameState = GameLogicDomainAPI.GameState(requestParams);
		gameRequest = GameLogicDomainAPI.GameRequest(requestParams);

		newProgressiveGameState = ProgressiveDataServiceAPI.GetProgressiveGameState(stake, gameState, gameRequest, gameRandom, gameProgressive);
		ProgressiveDataServiceAPI.AddJackpotLevelStatuses(newProgressiveGameState, stake, gameState, gameRequest, gameRandom, gameProgressive);

		gameProgressive.on('gameLogicProcessingComplete', function(gameLogicStateResponseJSON, result) {
			var reelOffsets;
			reelOffsets = gameLogicStateResponseJSON.FinalReelOffsets;
			
			rawMutatedGameStateJSON = GameLogicDomainAPI.RawJSON(gameLogicStateResponseJSON);
			slotGameLogicResponse = GameLogicResponseObjectsDomainAPI.SlotGameLogicResponse(rawMutatedGameStateJSON, 72.25, result.symbols, result.winLines, 0, reelOffsets);
			response.emit('gameLogicResponseReady', slotGameLogicResponse);
		});
	}
};

exports.latePayAwardWinnings = function(requestParams, response) {
	var gameState, gameRequest, awardWinGameState, prizes = [], moneyAmount, prize, slotGameStateAndPrizeResponse, gameProgressiveState, jackpotPrize, jackpotGameEvents, i, jackpotWon, rawMutatedGameStateJSON;
	console.log('AWARD WINNINGS SERVICE REQUEST PARAMS:' + JSON.stringify(requestParams, null, '/t'));
	if (requestParams) {
		gameRequest = GameLogicDomainAPI.GameRequest(requestParams);
		gameState = GameLogicDomainAPI.GameState(requestParams);

		if(gameRequest.Command !== GameLogicDomainAPI.getGameStateConstants().SPIN_COMPLETE) {
			throw 'Command did not equal SPIN_COMPLETE!';
		}

		if(gameState.Phase !== GameLogicDomainAPI.getGameStateConstants().SPINNING) {
			throw 'Incorrect phase to call award winnings!';
		}

		awardWinGameState = GameLogicDomainAPI.AwardWinGameState(GameLogicDomainAPI
				.getGameStateConstants().AWARD_WIN, gameState);
		/* DEPRECATED
		 * money = GameLogicDomainAPI.Money(gameState.PrizeAmount,
				gameState.CurrencyCode);
		*/
		moneyAmount = gameState.PrizeAmount;
		prize = GameLogicDomainAPI.Prize(GameLogicDomainAPI
				.getWinTypeConstants().REELS, moneyAmount, null);
		prizes.push(prize);
		
		gameProgressiveState = gameState.ProgressiveState;
		if (gameProgressiveState) {
			jackpotGameEvents = gameProgressiveState.JackpotGameEvents;
			for (i = 0; i < jackpotGameEvents.length; i += 1) {
				if(jackpotGameEvents[i].Content && jackpotGameEvents[i].Content.JackpotWon) {
					jackpotWon = jackpotGameEvents[i].Content.JackpotWon;
					/* DEPRECATED
					 * money = GameLogicDomainAPI.Money(jackpotWon.Value.Amount,
							jackpotWon.Value.CurrencyCode);
					*/		
					moneyAmount = jackpotWon.Value.Amount;
					jackpotPrize = GameLogicDomainAPI.Prize(GameLogicDomainAPI
							.getWinTypeConstants().PROGRESSIVE, moneyAmount,
							jackpotGameEvents[i].Content.WinningToken);
					prizes.push(jackpotPrize);
				}
			}
		}		
		

		rawMutatedGameStateJSON = GameLogicDomainAPI.RawJSON(awardWinGameState);
		slotGameStateAndPrizeResponse = GameLogicResponseObjectsDomainAPI
		.SlotGameStateAndPrizeResponse(rawMutatedGameStateJSON, prizes);

		response.emit('gameLogicResponseReady', slotGameStateAndPrizeResponse);
	}
};

exports.checkpoint = function() {

};

exports.refreshProgressive = function() {

};

exports.getGameIdentifier = function(response) {
	var gameIdentifier = GameLogicDomainAPI.GameIdentifier();
	response.emit('gameLogicResponseReady', gameIdentifier);
};

exports.getVirgoRemoteApiVersion = function(response) {
	var virgoRemoteApiVersion = '0.1';
	response.emit('gameLogicResponseReady', virgoRemoteApiVersion);
};

exports.getGameType = function(response) {
	var gameType = 'LATE_PAY_SLOT';
	response.emit('gameLogicResponseReady', gameType);
};

exports.getVirgoWalletType = function(response) {
	var virgoWalletType = GameLogicDomainAPI.VirgoWalletType();
	response.emit('gameLogicResponseReady', virgoWalletType);
};

exports.getVirginGameState = function(requestParams, response) {
	var dataRetrievalContext, gameRandom, losingStartingPositions, slotGameLogicResponse, receivedData, gameLogicStateResponseJSON, rawMutatedGameStateJSON;
	console.log('GET VIRGIN STATE');
	if (requestParams) {
		dataRetrievalContext = RemoteDataServiceAPI.DataRetrievalContext(
				requestParams.TokenRandom, requestParams.TokenProgressive);
		//
		gameRandom = RandomDataServiceAPI.GameRandom(dataRetrievalContext);	

		// (comms-hub.js)function receiveResponse, 触发了getRandomNumberJsonRpc2ResponseReceived事件
		gameRandom.on('getRandomNumberJsonRpc2ResponseReceived', function(responseBody) {
			var result, jsonRpc2ResponseJSON = JSON.parse(responseBody);
			
			receivedData = jsonRpc2ResponseJSON.result.Data;
			losingStartingPositions = GameLogicAPI.generateRandomReelOffsetsAfterRandomNumberReceived(receivedData);
			//losingStartingPositions = [6, 10, 11];

			//  计算奖金
			result = GameLogicAPI.CalculatePrizeAmountForReelOffsets(losingStartingPositions);
			if (result.prize > 0) { // 如果奖金大于0，就一直循环这个事件，直到＝0为止！
				GameLogicAPI.generateRandomReelOffsets(gameRandom);				
			} else {
				console.log("VIRGIN STATE FINISHED");
				gameLogicStateResponseJSON = {
						'Phase' : GameLogicDomainAPI
						.getGameStateConstants().IDLE,
						'ReelOffsets' : losingStartingPositions
				};
	
				rawMutatedGameStateJSON = GameLogicDomainAPI
				.RawJSON(gameLogicStateResponseJSON);
	
				slotGameLogicResponse = GameLogicResponseObjectsDomainAPI
				.SlotGameLogicResponse(rawMutatedGameStateJSON,0,result.symbols,result.winLines,0,losingStartingPositions);
	
				response.emit('gameLogicResponseReady',
						slotGameLogicResponse);
			}
		});

		// 这里会触发getRandomNumberJsonRpc2ResponseReceived事件，最终在(comms-hub.js)function receiveResponse
		GameLogicAPI.generateRandomReelOffsets(gameRandom);
	}
};

// TODO: 
exports.recallGameHistory = function (requestParams, response) {
//	var rawSlotGameLogicHistoryResponse, slotGameLogicHistoryResponse, gameHistory = [], gameHistoryEntryText, gameHistoryEntry, slotGameHistoryEntry, slotGameHistory = requestParams.SlotGameHistory, index;
	
//	for(index = 0; index < slotGameHistory.length; index += 1) {		
//		slotGameHistoryEntry = slotGameHistory[index];		
//		
//		gameHistoryEntryText = "";
//		gameHistoryEntry = {"HistoryText": "", "StateId": ""};
//		
//		if(slotGameHistoryEntry["Symbols"]) {
//			gameHistoryEntryText += " Symbols:" + slotGameHistoryEntry["Symbols"];
//		}
//		if(slotGameHistoryEntry["WinLines"]) {
//			gameHistoryEntryText += " WinLines:" + slotGameHistoryEntry["WinLines"];
//		}
//		if(slotGameHistoryEntry["ReelSetIndex"]) {
//			gameHistoryEntryText += " Reel Set Index:" + slotGameHistoryEntry["ReelSetIndex"];
//		}
//		if(slotGameHistoryEntry["Timestamp"]) {
//			gameHistoryEntryText += " Time:" + new Date(slotGameHistoryEntry["Timestamp"]);
//		}
//		if(slotGameHistoryEntry["ReelOffsets"]) {
//			gameHistoryEntryText += " Reel Offsets:" + slotGameHistoryEntry["ReelOffsets"];
//		}
//		if(slotGameHistoryEntry["BalanceAfterTransaction"]) {
//			gameHistoryEntryText += " Balance after transaction:" + slotGameHistoryEntry["BalanceAfterTransaction"];
//		}
//				
//		gameHistoryEntry.HistoryText = gameHistoryEntryText;
//		gameHistoryEntry.StateId = slotGameHistoryEntry.StateId;
//		
//		gameHistory.push(gameHistoryEntry);		
//	}
//	
//	

	var gameJson,	// {RawJson : "string content"}
	historyResponse; // { "GameHistory" : {RawJson : "string content"} }
	gameJson = GameLogicDomainAPI.RawJSON(requestParams.SlotGameHistory);
	historyResponse = GameLogicResponseObjectsDomainAPI.SlotGameLogicHistoryResponse(gameJson);
	response.emit('gameLogicResponseReady', historyResponse);
};
