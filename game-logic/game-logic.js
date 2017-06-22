/*jslint node: true */
"use strict"; 
var GameLogicDomainAPI = require('./game-logic-object-domain-api.js');

var numOfReels = 3;
function getReelBands() {
	var reelBands1, reelBands2, reelBands3, reelBands;
	reelBands1 = ['DIAMOND', 'INGG', 'ACE', 'ACE', 'INGG', 'ACE', 'ACE', 'ACE', 'INGG', 'ACE', 'ACE', 'ACE', 'INGG', 'ACE', 'ACE'];
	reelBands2 = ['ACE', 'DIAMOND', 'ACE', 'ACE', 'INGG', 'ACE', 'ACE', 'ACE', 'ACE', 'INGG', 'ACE', 'ACE', 'ACE', 'INGG', 'ACE'];
	reelBands3 = ['DIAMOND', 'ACE', 'ACE', 'DIAMOND', 'ACE', 'INGG', 'ACE', 'ACE', 'ACE', 'INGG', 'ACE', 'ACE', 'ACE',  'INGG', 'ACE', 'ACE'];
	
	reelBands = [reelBands1, reelBands2, reelBands3];
	
	return reelBands;
}

function getPayTable() {
	var payTable = [];
	
	payTable['INGG'] = 250;
	payTable['ACE'] = 20;
	payTable['DIAMOND'] = 0;
	
	return payTable;
}

function makeIterator(array){
    var nextIndex = 0;
    
    return {
       next: function(){
           return nextIndex < array.length ?
               {value: array[nextIndex += 1], done: false} :
               {done: true};
       }
    };
}


exports.generateRandomReelOffsets = function(gameRandom) {	
	var reelBands = getReelBands(), cumulativeReelBandLengthProduct = 1, reelBandIndex, currentReelBandLength;
	
	for (reelBandIndex = 0; reelBandIndex < numOfReels; reelBandIndex += 1) {				
		currentReelBandLength = reelBands[reelBandIndex].length;		
		cumulativeReelBandLengthProduct *= currentReelBandLength;		
	}
	
	if(!gameRandom.acceptingRequests) {
		throw "You cannot recycle old gameRandom objects";
	}
	
	gameRandom.getRandomNumber(gameRandom.token, gameRandom.remoteService.urlRest, cumulativeReelBandLengthProduct);
};

exports.generateRandomReelOffsetsAfterRandomNumberReceived = function(data) {
	var result = [numOfReels], reelBands = getReelBands(), reelBandIndex, offsetForReel, divideBy = [numOfReels], modBy = [numOfReels], cumulativeReelBandLengthProduct = 1, currentReelBandLength;
	for (reelBandIndex = 0; reelBandIndex < numOfReels; reelBandIndex += 1) {		
		divideBy[reelBandIndex] = cumulativeReelBandLengthProduct;		
		currentReelBandLength = reelBands[reelBandIndex].length;
		modBy[reelBandIndex] = currentReelBandLength;		
		cumulativeReelBandLengthProduct *= currentReelBandLength;		
	}
	
	for (reelBandIndex = 0; reelBandIndex < numOfReels; reelBandIndex += 1) {
		offsetForReel = Math.round(Math.floor(data / divideBy[reelBandIndex]) % modBy[reelBandIndex]);
		result[reelBandIndex] = offsetForReel;
	}
	console.log('generateRandomReelOffsetsAfterRandomNumberReceived:'+result);
	return result;
};

exports.CalculatePrizeAmountForReelOffsets = function(reelOffsets) {
	console.log('CalculatePrizeAmountForReelOffsets:'+reelOffsets);
	var winSymbol, reelBandIndex = 0, variousSymbolsOnWinLine = [getReelBands()[reelBandIndex][reelOffsets[reelBandIndex]]], numberOfUniqueSymbolsOnWinLine, isWin, iterator, reelOffsetValue, winSymbolExists, winSymbolsCounter, prize, symbols, winLines;

	symbols = "";
	for (reelBandIndex = 0; reelBandIndex < numOfReels; reelBandIndex += 1) {
		winSymbol = getReelBands()[reelBandIndex][reelOffsets[reelBandIndex]];
		winSymbolExists = false;
		if(winSymbol === "INGG"){
			symbols += 'I';
		}else if(winSymbol === "ACE"){
			symbols += 'A';			
		}else if(winSymbol === "DIAMOND"){
			symbols += 'D';			
		}else{
			throw "Unknown symbol: "+winSymbol;
		}
		
		for(winSymbolsCounter = 0; winSymbolsCounter < variousSymbolsOnWinLine.length; winSymbolsCounter += 1) {
			if(winSymbol !== variousSymbolsOnWinLine[winSymbolsCounter]) {
				winSymbolExists = true;
				break;
			}
		}
		if(winSymbolExists) {
			variousSymbolsOnWinLine.push(winSymbol);
		}
	}
	
	if((variousSymbolsOnWinLine.length === 1) && variousSymbolsOnWinLine[0] === winSymbol) {
		isWin = true;
	}
	
	if(isWin) {		
		prize = getPayTable()[variousSymbolsOnWinLine[0]];
		winLines = [0];
	} else {
		prize = 0;
		winLines = [];
	}
	
	return {
		prize: prize,
		symbols: symbols,
		winLines: winLines
	};
};


exports.validateStartGameParameters = function(gameRequestCommand, stakeAmount, currentPhase) {
	if(currentPhase !== GameLogicDomainAPI.getGameStateConstants().IDLE) {
		throw 'Incorrect phase to call startGame';
	}		
	if(gameRequestCommand !== GameLogicDomainAPI.getGameStateConstants().SPIN) {
		throw 'Command did not equal SPIN!';
	}
	
	//TODO: Add logic to provide proper wins/gambles with different stakes
	//	if(stakeAmount !== 10) {
	//		throw 'Stake mismatch!';
	//	}	
};

exports.getNewInstanceReelsWin = function(money){
	
	
};
