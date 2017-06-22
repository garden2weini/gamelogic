/*jslint node: true */
"use strict"; 

exports.SlotGameLogicResponse = function(mutatedState, rtp, symbols, winLines, reelSet, reelOffsets) {
	if(typeof rtp !== "number"){
		throw "RTP must be supplied";
	}
	if(typeof symbols !== "string"){
		throw "Result symbols must be specified";
	}
	var mutatedStateJSON = {
			'MutatedState': mutatedState,
			'Rtp': rtp,
			'Symbols': symbols,
			'WinLines': winLines,
			'ReelSet': reelSet,
			'ReelOffsets': reelOffsets
	};
	return mutatedStateJSON;
};

exports.SlotGameStateAndPrizeResponse = function(mutatedState, prizes, rtp) {
	var mutatedStateJSON = {
			'MutatedState': mutatedState,
			'Prizes': prizes,
			'Rtp': rtp							
	};
	
	return mutatedStateJSON;
};

exports.SlotGameLogicHistoryResponse = function (gameHistory) {
	var gameHistoryResponse = {
			'GameHistory': gameHistory
	};
	
	return gameHistoryResponse;
};
