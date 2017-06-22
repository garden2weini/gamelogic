/*jslint node: true */
"use strict";

var currencies = {
		
		"ARS": {
			name: "Argentinian Pesos", symbol: "$"
		},
		"AUD": {
			name: "Australian Dollars", symbol: "$"
		},
		"BGN": {
			name: "Bulgaria Lev", symbol: "\u043B\u0432"
		},
		"BRL": {
			name: "Brazilian Reais", symbol: "R$"
		},
		"CAD": {
			name: "Canada  – Dollar", symbol: "$"
		},
		"CNY": {
			name: "Chinese - Renminbi", symbol: "\u00A5"
		},
		"CZK": {
			name: "Czech - Koruna", symbol: "K\u010D"
		},
		"DKK": {
			name: "Denmark - Kroner", symbol: "kr"
		},
		"EUR": {
			name: "European Union - Euro", symbol: "\u20AC"
		},
		"HKD": {
			name: "Hong Kong - Dollar", symbol: "$"
		},
		"HUF": {
			name:  "Hungary - Forint", symbol: "Ft"
		},
		"ISK": {
			name: "Iceland - Kroner", symbol: "kr"
		},
		"INR": {
			name: "India – Rupee", symbol: "\u20A8"
		},
		"JPY": {
			name: "Japan - Yen", symbol: "\u00A5"
		},
		"MYR": {
			name: "Malaysia - Ringgit", symbol: "RM"
		},
		"MXN": {
			name: "Mexico - Peso", symbol: "$"
		},
		"NZD": {
			name: "New Zealand - Dollar", symbol: "$"
		},
		"NOK": {
			name: "Norway - Kroner", symbol: "kr"
		},
		"PLN": {
			name: "Poland - Zloty", symbol: "z\u0142"
		},
		"RON": {
			name: "Romania - New Leu", symbol: "lei"
		},
		"SEK": {
			name: "Sweden - Krona", symbol: "kr"
		},
		"SGD": {
			name: "Singapore - Dollar", symbol: "$"
		},
		"ZAR": {
			name: "South Africa - Rand", symbol: "R"
		},
		"CHF": {
			name: "Switzerland - Franc", symbol: "CHF"
		},
		"TWD": {
			name: "Taiwan - Dollar", symbol: "$"
		},
		"THB": {
			name: "Thailand - Baht", symbol: "\u0E3F"
		},
		"GBP": {
			name: "United Kingdom - Pounds", symbol: "£"
		},
		"USD": {
			name: "United States - Dollar", symbol: "$"
		},
		"XXX": {
			name: "Credit", symbol: ""
		}
}; 

exports.Currency = function () {
	return currencies;
};