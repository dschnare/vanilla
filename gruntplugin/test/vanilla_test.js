'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.vanilla = {
  setUp: function(done) {
    // setup here if necessary
    done();
  },
  default_layout: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/default_layout/index.html');
    var expected = grunt.file.read('test/expected/default_layout/index.html');
    test.equal(actual, expected, 'expect the blocks to be preserved when no extensions are available.');

    test.done();
  },
  extension_layout: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/extension_layout/index.html');
    var expected = grunt.file.read('test/expected/extension_layout/index.html');
    test.equal(actual, expected, 'expect the blocks to be replaced appropriately when extensions are available.');

    test.done();
  },
  nested_layout: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/nested_layout/index.html');
    var expected = grunt.file.read('test/expected/nested_layout/index.html');
    test.equal(actual, expected, 'expect the blocks to be replaced appropriately throughout the layout hierarchy.');

    test.done();
  }
};
