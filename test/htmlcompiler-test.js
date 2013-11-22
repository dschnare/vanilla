var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('HTMLCompiler').addBatch({
  'An HTMLCompiler': {
    'when compiling a template with no includes in debug mode': {
      topic: function () {
        compiler.compile('a.html', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should produce the same template': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/a.html'));
        assert(fs.existsSync(path.resolve('./test/support/project/web/a.html')));
      }
    },
    'when compiling a template with includes in debug mode': {
      topic: function () {
        compiler.compile('b.html', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should produce a template with the includes': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/b.html'));
        assert(fs.existsSync(path.resolve('./test/support/project/web/b.html')));
        assert(!fs.existsSync(path.resolve('./test/support/project/web/c.html')));
      }
    },
    'when compiling a template with includes and scripts in debug mode': {
      topic: function () {
        compiler.compile('d.html', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should produce a template with the includes and scripts': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/d.html'));
        assert(fs.existsSync(path.resolve('./test/support/project/web/d.html')));
      }
    },
    'when compiling a template with an extends': {
      topic: function () {
        compiler.compile('e.html', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should produce a template based on the extended template': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/e.html'));
        assert(fs.existsSync(path.resolve('./test/support/project/web/e.html')));
      }
    }
  }
}).export(module);