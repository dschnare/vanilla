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
      'should read a self-closing include directive': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal('include', d.name);
        assert.equal(d.attributes.file, 'header.html');
        assert(d.closing);
        assert(d.selfClosing);
        assert.equal(d.start, 0);
        assert.equal(d.end, '<v:include file="header.html"/>'.length);
      },
      'should read a self-closing script directive': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal('script', d.name);
        assert.equal(d.attributes.src, 'somefile.js');
        assert(d.closing);
        assert(d.selfClosing);
      },
      'should read a self-closing stylesheet directive': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal('stylesheet', d.name);
        assert.equal(d.attributes.src, 'somefile.css');
        assert(d.closing);
        assert(d.selfClosing);
      },
      'should read a block directive': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal('block', d.name);
        assert.equal(d.attributes.name, 'a');
        assert(!d.closing);
        assert(!d.selfClosing);
      },
      'should read a closing block directive': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal('block', d.name);
        assert(d.closing);
        assert(!d.selfClosing);
      },
      'should read a self-closing test directive': function (topic) {
        var d, k;
        
        d = topic.next();
        assert.equal('test', d.name);
        assert(d.closing);
        assert(d.selfClosing);
      }
    }
  }
}).export(module);