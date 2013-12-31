'use strict';

var GRUNT, VANILLA, PATH;

GRUNT = require('grunt');
VANILLA = require('../index');
PATH = require('path');

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
  fileNormalization: function (test) {
    var files;
    
    test.expect(17);
    
    files = VANILLA.normalizeFiles('index.js');
    test.equal(files.length, 0, 'expect no files to be normalized when passed a string.');
    
    files = VANILLA.normalizeFiles(['index.js']);
    test.equal(files.length, 1, 'expect one file to be normalized.');
    test.equal(files[0].src, PATH.resolve('index.js'), 'expect the src property to be an absolute path.');
    test.equal(files[0].dest, PATH.resolve('index.js').replace(/index.js$/, 'out-index.js'), 'expect the dest property to be a default value who\'s basename is prefixed with "out-"');
    
    files = VANILLA.normalizeFiles(['index.js', 'lib/processor/lib']);
    test.equal(files.length, 2, 'expect two files to be normalized.');
    test.equal(files[0].src, PATH.resolve('index.js'), 'expect the src property to be an absolute path.');
    test.equal(files[0].dest, PATH.resolve('out-index.js'), 'expect the dest property to be a default value who\'s basename is prefixed with "out-"');
    test.equal(files[1].src, PATH.resolve('lib/processor/lib/index.js'), 'expect the src property to be an absolute path.');
    test.equal(files[1].dest, PATH.resolve('lib/processor/lib/out-index.js'), 'expect the dest property to be a default value who\'s basename is prefixed with "out-"');
    
    files = VANILLA.normalizeFiles([{src:'index.js', dest:'index2.js'}]);
    test.equal(files.length, 1, 'expect one file to be normalized.'); 
    test.equal(files[0].src, PATH.resolve('index.js'), 'expect the src property to be an absolute path.');
    test.equal(files[0].dest, PATH.resolve('index2.js'), 'expect the dest property be an absolute path with "index2.js"');
    
    files = VANILLA.normalizeFiles([{src:'index.js', dest:'index2.js'}, {src:'lib/processor/lib', dest:'index3.js'}]);
    test.equal(files.length, 2, 'expect two files to be normalized.');
    test.equal(files[0].src, PATH.resolve('index.js'), 'expect the src property to be an absolute path.');
    test.equal(files[0].dest, PATH.resolve('index2.js'), 'expect the dest property to be am absolute path with "index2.js"');
    test.equal(files[1].src, PATH.resolve('lib/processor/lib/index.js'), 'expect the src property to be an absolute path.');
    test.equal(files[1].dest, PATH.resolve('lib/processor/lib/out-index.js'), 'expect the dest property to be a default value who\'s basename is prefixed with "out-"');
    
    test.done();
  },
  default_layout: function(test) {
    test.expect(1);

    var actual = GRUNT.file.read('tmp/default_layout/index.html');
    var expected = GRUNT.file.read('test/expected/default_layout/index.html');
    test.equal(actual, expected, 'expect the blocks to be preserved when no extensions are available.');

    test.done();
  },
  extension_layout: function(test) {
    test.expect(1);

    var actual = GRUNT.file.read('tmp/extension_layout/index.html');
    var expected = GRUNT.file.read('test/expected/extension_layout/index.html');
    test.equal(actual, expected, 'expect the blocks to be replaced appropriately when extensions are available.');

    test.done();
  },
  nested_layout: function(test) {
    test.expect(1);

    var actual = GRUNT.file.read('tmp/nested_layout/index.html');
    var expected = GRUNT.file.read('test/expected/nested_layout/index.html');
    test.equal(actual, expected, 'expect the blocks to be replaced appropriately throughout the layout hierarchy.');

    test.done();
  },
  includes: function(test) {
    test.expect(1);

    var actual = GRUNT.file.read('tmp/includes/index.html');
    var expected = GRUNT.file.read('test/expected/includes/index.html');
    test.equal(actual, expected, 'expect included files to be parsed and inserted appropriately.');

    test.done();
  },
  data: function(test) {
    test.expect(1);

    var actual = GRUNT.file.read('tmp/data/index.html');
    var expected = GRUNT.file.read('test/expected/data/index.html');
    test.equal(actual, expected, 'expect data to be parsed and interpolated correctly.');

    test.done();
  }
};
