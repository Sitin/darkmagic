var debug = require('debug')('dummyCallbackSync');
var util = require('util');
var assert = require('assert');

var calls = 0;

// used in tests, but sadly must reside here
module.exports = function (callback) {
	assert.ok (++calls < 2);
	debug('here');
	callback(null, 3);
};