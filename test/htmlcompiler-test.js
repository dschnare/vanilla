var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('HTMLCompiler').addBatch({
  'An HTMLCompiler': {
    'when compiling a template with no includes in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/templates/a.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './build'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should produce the same template': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/a.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/build/a.html')));
      }
    },
    'when compiling a template with includes in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/templates/b.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './build'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should produce a template with the includes': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/b.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/build/b.html')));
        assert(!fs.existsSync(path.resolve('./test/support/web/build/c.html')));
      }
    },
    'when compiling a template with includes and scripts in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/templates/d.html', 'debug', {
          server: {
            root: './test/support/web'
          },
          html: {
            output: './build'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should produce a template with the includes and scripts': function (error, result) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/d.html'));
        assert(fs.existsSync(path.resolve('./test/support/web/build/d.html')));
      }
    }
  }
}).export(module);