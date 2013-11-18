var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('HTMLCompiler').addBatch({
  'An HTMLCompiler': {
    'when compiling a template with no includes in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/html/src/a.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './html/build'
          },
          js: {
            output: './js/build'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should produce the same template': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/html/build/a.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/html/build/a.html')));
      }
    },
    'when compiling a template with includes in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/html/src/b.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './html/build'
          },
          js: {
            output: './js/build'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should produce a template with the includes': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/html/build/b.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/html/build/b.html')));
        assert(!fs.existsSync(path.resolve('./test/support/web/html/build/c.html')));
      }
    },
    'when compiling a template with includes and scripts in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/html/src/d.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './html/build'
          },
          js: {
            output: './js/build'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should produce a template with the includes and scripts': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/html/build/d.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/html/build/d.html')));
      }
    },
    'when compiling a template with an extends': {
      topic: function () {
        compiler.compile('./test/support/web/html/src/e.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './html/build'
          }
        }, this.callback);
      },
      'should produce a template based on the extended template': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/html/build/e.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/html/build/e.html')));
      }
    }
  }
}).export(module);