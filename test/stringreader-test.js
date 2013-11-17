var vows = require('vows');
var assert = require('assert');
var createStringReader = require('./../lib/stringreader').createStringReader;

vows.describe('StringReader').addBatch({
  'A StringReader': {
    'initialized with the empty string': {
      topic: createStringReader(''),
      'has no characters': function (topic) {
        assert(!topic.readChar());
      },
      'cannot be read': function (topic) {
        assert(!topic.read());
      },
      'has nothing to consume': function (topic) {
        assert(!topic.consume());
      }
    },
    'initialized with "apple shop on the corner"': {
      topic: createStringReader('apple shop on the corner'),
      'reads the first three characters as "app"': function (topic) {
        assert.equal(topic.readChar(), 'a');
        assert.equal(topic.readChar(), 'p');
        assert.equal(topic.readChar(), 'p');
      },
      'can read "le sho"': function (topic) {
        assert.equal(topic.read(function (c) {
          return c === 'p';
        }), 'le sho');
      },
      'the next char is "p"': function (topic) {
        assert.equal(topic.peekChar(), 'p');
      },
      'can consume "the"': function (topic) {
        assert(topic.consume('the'));
      },
      'position to be 17': function (topic) {
        assert.equal(topic.position(), 17);
      },
      'can read " corner"': function (topic) {
        assert.equal(topic.read(), ' corner');
      },
      'has no more characters': function (topic) {
        assert(!topic.readChar());
      }
    }
  }
}).export(module);