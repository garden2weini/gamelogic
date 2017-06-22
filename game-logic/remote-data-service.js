/*jslint node: true */
"use strict";

exports.DataSource = function(dataSourceString) {
	var dataSource = {
			'dataSource': dataSourceString
	};
	
	return dataSource;
};

exports.DataRetrievalContext = function(tokenRandom, tokenProgressive) {
	var dataRetrievalContext = {
			'tokenRandom': tokenRandom,
			'tokenProgressive': tokenProgressive
	};
	
	return dataRetrievalContext;
};

exports.RestDataService = function(serviceURI) {
	var restDataService = {
			'urlRest': serviceURI
	};
	
	return restDataService;
};
