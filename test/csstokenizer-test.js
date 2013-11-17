var vows = require('vows');
var assert = require('assert');
var createStringReader = require('./../lib/stringreader').createStringReader;
var createTokenizer = require('./../lib/compiler/css/tokenizer').createTokenizer;
var fs = require('fs');

vows.describe('CSSTokenizer').addBatch({
  'A CSSTokenizer': {
    'initialized with an empty string': {
      topic: createTokenizer(createStringReader('')),
      'should have no tokens': function (topic) {
        assert(!topic.next().name);
      }
    },
    'initialized with a stylesheet with no directives': {
      topic: createTokenizer(createStringReader(fs.readFileSync('./test/support/empty.css', 'utf8'))),
      'should have no tokens': function (topic) {
        assert(!topic.next().name);
      }
    },
    'initialized with a stylesheet': {
      topic: createTokenizer(createStringReader(fs.readFileSync('./test/support/directives.css', 'utf8'))),
      'should read an import directive with "somefile.css"': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'import');
        assert.equal(d.value, 'somefile.css');
        assert.equal(d.start, 3);
        assert.equal(d.end, '@@import "somefile.css"'.length + 3);
      },
      'should read a debug directive': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'debug');
        assert.equal(d.value, '');
      },
      'should read an enddebug directive': function (topic) {
        var d = topic.next();
        assert.equal(d.name, 'enddebug');
        assert.equal(d.value, '');
      }
    }
  }
}).export(module);