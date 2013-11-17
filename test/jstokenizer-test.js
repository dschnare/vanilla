var vows = require('vows');
var assert = require('assert');
var createStringReader = require('./../lib/stringreader').createStringReader;
var createTokenizer = require('./../lib/compiler/js/tokenizer').createTokenizer;
var fs = require('fs');

vows.describe('JavaScriptTokenizer').addBatch({
  'A JavaScriptTokenizer': {
    'initialized with an empty string': {
      topic: createTokenizer(createStringReader('')),
      'should have no tokens': function (topic) {
        assert(!topic.next().name);
      }
    },
    'initialized with a script with no directives': {
      topic: createTokenizer(createStringReader(fs.readFileSync('./test/support/empty.js', 'utf8'))),
      'should have no tokens': function (topic) {
        assert(!topic.next().name);
      }
    },
    'initialized with a script': {
      topic: createTokenizer(createStringReader(fs.readFileSync('./test/support/directives.js', 'utf8'))),
      'should read an import directive with "somefile.js"': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'import');
        assert.equal(d.value, 'somefile.js');
        assert.equal(d.start, 0);
      },
      'should read an import directive with "somefile2.js"': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'import');
        assert.equal(d.value, 'somefile2.js');
      },
      'should read a debug directive': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'debug');
        assert.equal(d.value, '');
      },
      'should read an enddebug directive': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'end');
        assert.equal(d.value, '');
      }
    }
  }
}).export(module);