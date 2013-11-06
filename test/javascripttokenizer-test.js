var vows = require('vows');
var assert = require('assert');
var createStringReader = require('./../lib/stringreader').createStringReader;
var createTokenizer = require('./../lib/javascripttokenizer').createTokenizer;
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
      'should read all directives': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal(d.name, 'import');
        assert.equal(d.value, 'somefile.js');
        assert.equal(d.start, 0);
        assert.equal(d.end, '//#import "somefile.js"'.length);
        
        k = d.end;
        d = topic.next();
        assert.equal(d.name, 'import');
        assert.equal(d.value, 'somefile2.js');
        assert.equal(d.start, k + 1);
        assert.equal(d.end, '//#import "somefile2.js"'.length + k + 1);
        
        d = topic.next();
        assert.equal(d.name, 'debug');
        assert.equal(d.value, '');
        
        d = topic.next();
        assert.equal(d.name, 'end');
        assert.equal(d.value, '');
      }
    }
  }
}).export(module);