var debug = require('debug')('dummyCallbackAsync');
module.exports = function(callback) {
	debug('here');
	process.nextTick(function () {
		callback(null, 4);
	});
};