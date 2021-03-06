var debug = require('debug')('darkmagic_Injector.test')
var path = require('path')
var Injector = require('../lib/Injector.js')
var assert = require('assert')
var util = require('util')
var Module = require('module')
var Dependency = require('../lib/Dependency.js')

var injector
var toClear

function b4() {
	toClear = []
	injector = new Injector({ explicitRealModule: module })
	injector.addSearchPath(path.join(__dirname, 'lib'))
	injector.on('new dependency', function (dependency) {
		toClear.push(dependency.requireId)
	})
}

function after() {
	for (var i = 0; i < toClear.length; i++) {
		for (var x in require.cache) {
			if (require.cache[x].id === toClear[i].requireId) {
				delete require.cache[x]
			}
		}
	}

	debug('------------------ done ------------------')
}

describe('Dependency Injector', function () {

	beforeEach(b4)
	afterEach(after)


	it('invokes', function (done) {
		injector.inject(function invoking() {
			done()
		})
	})

	it('enforces illegal parameter names', function () {
		assert.throws(function () {
			injector.inject(function illegal(toString) {

			})
		})
	})

	describe('injects', function () {

		it('itself', function () {
			injector.inject(function($injector) {
				assert.strictEqual($injector, injector)
			})
		})

		it('dependencies from core modules', function (done) {
			injector.inject(function coreModules(http, net) {
				assert.strictEqual(http, require('http'))
				assert.strictEqual(net, require('net'))
				done()
			})
		})

		it('dependencies from node modules', function (done) {

			injector.inject(function nodeModules(eyes, esprima) {
				assert.strictEqual(eyes, require('eyes'))
				assert.strictEqual(esprima, require('esprima'))
				done()
			})
		})

		it('dependencies from search paths', function (done) {

			injector.inject(function searchPaths(dummy, dummy2) {
				assert.strictEqual(dummy, 2)
				assert.strictEqual(dummy2, 1)
				done()
			})
		})

		it('dependencies from all over the place', function (done) {

			injector.inject(function (http, eyes, dummy, dummyCallbackAsync) {
				assert.strictEqual(dummy, 2)
				assert.strictEqual(http, require('http'))
				assert.strictEqual(eyes, require('eyes'))
				assert.strictEqual(dummyCallbackAsync, 4)
				done()
			})
		})

		it('recursively', function (done) {

			injector.inject(function (dummy2, dummy) {
				assert.strictEqual(dummy2, 1)
				assert.strictEqual(dummy, 2)
				done()
			})
		})

		it('with no dependencies and no return values (dependency invoke only)', function (done) {
			injector.inject(function noDeps(dummyNoReturn) {
				done()
			})
		})

		it('does not inject capitalized functions', function (done) {
			assert.doesNotThrow(function(){
				injector.inject(function capitalized(dummyClass) {
					done()
				})
			})
		})

		it('screams when dependencies are missing', function (done) {

			assert.throws(function () {
				injector.inject(function(dummyMissing) {

				})
			}, verifyError(done, 'Missing'), '"dependency missing"')

		})

		it('does not scream when dependencies are optional', function (done) {

			assert.doesNotThrow(function () {
				// optional does not exist
				injector.inject(function(optional_) {
					done()
				})
			})
		})

		it('does not auto inject external factories if told so', function (done) {
			injector.autoInjectExternalFactories = false
			injector.inject(function(findPort) {
				assert.ok(findPort instanceof Function)
				assert.strictEqual(findPort, require('find-port'))
				done()
			})
		})

		it('does not auto inject local factories if told so', function (done) {
			injector.autoInjectLocalFactories = false

			injector.inject(function(dummy) {

				assert.ok(dummy instanceof Function)
				assert.strictEqual(dummy, require('./lib/dummy'))
				done()
			})
		})

		it('does not inject top level exported functions that are named dontInject', function (done) {
			injector.inject(function(dummyDontInject) {

				assert.ok(dummyDontInject instanceof Function)
				assert.strictEqual(dummyDontInject, require('./lib/dummyDontInject'))
				assert.strictEqual(dummyDontInject(), 123)
				done()
			})
		})

		it('always injects top level exported functions that are named dontInject', function (done) {
			injector.inject(function(dummyInject) {

				assert.strictEqual(dummyInject, 123)
				done()
			})
		})

		// check sync and async
		describe('a dependency via a callback if dependency is a factory and has a last parameter called "callback"', function () {

			it('synchronously with single param', function (done) {
				injector.inject(function sync(dummyCallbackSync) {
					assert.strictEqual(dummyCallbackSync, 3)
					done()
				})
			})

			it('synchronously with multiple params', function (done) {
				injector.inject(function sync(dummyCallbackSyncMulti) {
					assert.strictEqual(dummyCallbackSyncMulti, 9)
					done()
				})
			})

			it('asynchronously with a single param', function (done) {

				injector.inject(function async(dummyCallbackAsync) {
					assert.strictEqual(dummyCallbackAsync, 4)
					done()
				})
			})

			it('asynchronously with multiple params', function (done) {
				injector.inject(function async(dummyCallbackAsyncMulti) {
					assert.strictEqual(dummyCallbackAsyncMulti, 10)
					done()
				})
			})

			it('resolves a hierarchy of callbacks', function () {
				injector.inject(function hierarchy(dummyHierarchy) {
					assert.strictEqual(dummyHierarchy.dummyCallbackAsyncMulti, require('./lib/dummyCallbackAsyncMulti'))
					assert.strictEqual(dummyHierarchy.dummyCallbackAsyncMulti, 10)

					assert.strictEqual(dummyHierarchy.dummyCallbackSyncMulti, require('./lib/dummyCallbackSyncMulti'))
					assert.strictEqual(dummyHierarchy.dummyCallbackSyncMulti, 9)
				})
			})
		})
	})

	describe('use the module system', function () {

		it('factory invocation are only executed once, subsequent injections do not invoke the factory again', function (done) {
			// dummy cache is a module that returns a function
			// that function gives the test access to module internal
			// calls counter.
			// each invocation of require('dummyCache') will increament
			// the calls counter, thus if the result cache would have
			// broken, dummyCache() would return something higher than 1

			injector.inject(function noDeps(dummyCache) {
				var calls = dummyCache()
				assert.strictEqual(calls, 1)

				injector.inject(function noDeps1(dummyCache) {
					var calls = dummyCache()
					assert.strictEqual(calls, 1)
					done()
				})
			})
		})

		it('makes subsequent require() calls return the result of the factory, rather than the exported factory function', function (done) {
			injector.inject(function noDeps1(dummyCache) {
				var calls = dummyCache()
				assert.strictEqual(calls, 1)

				injector.inject(function noDeps2(dummyCache) {
					var actual = require('./lib/dummyCache')
					assert.strictEqual(actual, dummyCache)
					assert.strictEqual(actual(), 1)
					done()
				})
			})
		})
	})

	describe('provides api to manually add and remove dependencies', function () {

		it('remove()', function () {
			injector.inject(function remove(dummy) {
				var dependency = injector.getDependency('dummy')
				assert.ok(dependency instanceof Dependency)

				injector.remove('dummy')

				assert.strictEqual(require.cache[dependency.requireId], undefined)
				assert.strictEqual(injector.getDependency('dummy'), undefined)
			})
		})

		it('add()', function () {
			var dependency = new Dependency('foo')
			dependency.requireId = 'http'

			injector.add(dependency)

			injector.inject(function (foo) {
				assert.strictEqual(foo, require('http'))
			})
		})
	})

	describe('detects circular dependencies', function () {

		function verifyError(done) {
			return function(err) {
				// this sucks but so does trying to inherit from Error
				if (err instanceof Error && err.message && err.message.indexOf('circular') > -1) {
					done()
					return true
				} else {
					done(err)
					return false
				}

			}
		}

		it('- direct', function (done) {
			assert.throws(function () {
				injector.inject(function (dummyCircular1) {
					done('should not have been called')
				})
			}, verifyError(done, 'circular'))
		})

		it('- indirect', function (done) {
			assert.throws(function () {
				injector.inject(function (dummyCircular3) {
					done('should not have been called')
				})
			}, verifyError(done, 'circular'))
		})

		it('- callback', function (done) {
			assert.throws(function () {
				injector.inject(function (dummyCircularAsync1) {
					done('should not have been called')
				})
			}, verifyError(done, 'circular'))
		})
	})

	describe('injector.prototype._getFunctionParameters', function () {

		it('extracts the parameters from a function\'s signature', function () {
			function f(a, b, c) {
			}

			var actual = Injector.prototype._getFunctionParameters(f)
			var expected = [ { name: 'a' }, { name: 'b' }, { name: 'c' } ]

			assert.strictEqual(actual.length, 3)

			for (var i = 0; i < actual.length; i++) {
				assert.strictEqual(actual[i].name, expected[i].name)
			}
		})

		it('throws an error if argument is not a function', function () {
			assert.throws(function () {
				Injector.prototype._getFunctionParameters({})
			})
		})

		it('parses anonymous functions', function () {
			var actual = Injector.prototype._getFunctionParameters(function(a, b, c) {})

			var expected = [ { name: 'a' }, { name: 'b' }, { name: 'c' } ]

			assert.strictEqual(actual.length, 3)

			for (var i = 0; i < actual.length; i++) {
				assert.strictEqual(actual[i].name, expected[i].name)
			}
		})

		it('returns an empty array if function has no parameters', function () {
			function f() {}

			var actual = Injector.prototype._getFunctionParameters(f)

			assert.deepEqual(actual, [])
		})
	})
})

function verifyError(done, keyword) {
	return function(err) {
		// this sucks but so does trying to inherit from Error
		if (err instanceof Error && err.message && err.message.indexOf(keyword) > -1) {
			done()
			return true
		} else {
			done(err)
			return false
		}

	}
}
