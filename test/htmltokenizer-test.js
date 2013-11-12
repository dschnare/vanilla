var vows = require('vows');
var assert = require('assert');
var createStringReader = require('./../lib/stringreader').createStringReader;
var createTokenizer = require('./../lib/compiler/html/tokenizer').createTokenizer;
var fs = require('fs');

vows.describe('HTMLTokenizer').addBatch({
  'A HTMLTokenizer': {
    'initialized with an empty string': {
      topic: createTokenizer(createStringReader('')),
      'should have no tokens': function (topic) {
        assert(!topic.next().name);
      }
    },
    'initialized with a template with no directives': {
      topic: createTokenizer(createStringReader(fs.readFileSync('./test/support/empty.html', 'utf8'))),
      'should have no tokens': function (topic) {
        assert(!topic.next().name);
      }
    },
    'initialized with a template': {
      topic: createTokenizer(createStringReader(fs.readFileSync('./test/support/directives.html', 'utf8'))),
      'should read all directives': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal(d.name, 'include');
        assert.equal(d.attributes.file, 'header.html');
        assert.equal(d.start, 0);
        assert.equal(d.end, '<v:include file="header.html"/>'.length);
      }
    }
  }
}).export(module);