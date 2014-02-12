var Container = require('../lib/Container.js');
var assert = require('assert');
var util = require('util');

describe('Dependency Container', function () {
	describe('inject', function () {
		it('injects dependencies from core modules', function (done) {

			var container = new Container();

			container.inject(function (http) {
				assert.strictEqual(http, require('http'));
				done();
			});
		});

		it('injects dependencies from node modules', function (done) {

			var container = new Container();

			container.inject(function (eyes) {
				assert.strictEqual(eyes, require('eyes'));
				done();
			});
		});

		it('injects dependencies from search paths', function (done) {

			var container = new Container();

			container.inject(function (dummy) {
				assert.strictEqual(dummy, 2);
				done();
			});
		});

		it('injects dependencies from all over the place', function (done) {

			var container = new Container();

			container.inject(function (http, eyes, dummy) {
				assert.strictEqual(dummy, 2);
				assert.strictEqual(http, require('http'));
				assert.strictEqual(eyes, require('eyes'));
				done();
			});
		});

		it('inject recursively', function (done) {

			var container = new Container();

			container.inject(function (dummy2) {
				assert.strictEqual(dummy2, 1);
				done();
			});
		});

		it('uses a last parameter named "callback" as actual callback to obtain the injected dependency', function (done) {

			var container = new Container();

			container.inject(function (dummyCallback) {
				assert.strictEqual(dummyCallback, 3);
				done();
			});
		});
	});

	describe.skip('Container.prototype._getFunctionParameters', function () {
		it('extracts the parameters from a function\'s signature', function () {
			function f(a, b, c) {
			}

			var actual = Container.prototype._getFunctionParameters(f);
			var expected = [ { name: 'a' }, { name: 'b' }, { name: 'c' } ];

			assert.strictEqual(actual.length, 3);

			for (var i = 0; i < actual.length; i++) {
				assert.strictEqual(actual[i].name, expected[i].name);
			}
		});

		it('throws an error if argument is not a function', function () {
			assert.throws(function () {
				Container.prototype._getFunctionParameters({});
			});
		});

		it('parses anonymous functions', function () {
			var actual = Container.prototype._getFunctionParameters(function(a, b, c) {});

			var expected = [ { name: 'a' }, { name: 'b' }, { name: 'c' } ];

			assert.strictEqual(actual.length, 3);

			for (var i = 0; i < actual.length; i++) {
				assert.strictEqual(actual[i].name, expected[i].name);
			}
		});

		it('returns nothing if function has no parameters', function () {
			function f() {}

			var actual = Container.prototype._getFunctionParameters(f);

			assert.strictEqual(actual, undefined);
		});
	});
});