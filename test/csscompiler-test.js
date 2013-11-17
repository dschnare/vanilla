var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('CSSCompiler').addBatch({
  'A CSSCompiler': {
    'when compiling a stylesheet with no imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/d.css', 'debug', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only provide <link> elements for one stylesheet': function (error, result, markup) {
        assert(!error);
        assert.equal(result, '');
        assert.equal(markup, '<link rel="stylesheet" href="/css/src/d.css" />\n');
      }
    },
    'when compiling a stylesheet with no imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/d.css', 'concat', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only build one stylesheet': function (error, result, markup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/css/build/d.max.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a stylesheet with imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/e.css', 'debug', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only provide <link> elements for two stylesheets': function (error, result, markup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<link rel="stylesheet" href="/css/src/d.css" />',
          '<link rel="stylesheet" href="/css/src/e.css" />'
        ];
        
        assert.equal(markup, imports.join('\n') + '\n');
      }
    },
    'when compiling a stylesheet with imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/e.css', 'concat', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only build one stylesheet': function (error, result, markup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/css/build/e.max.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a stylesheet with cyclic imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/a.css', 'debug', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only provide <link> elements for each unique stylesheet': function (error, result, markup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<link rel="stylesheet" href="/css/src/theme/c.css" />',
          '<link rel="stylesheet" href="/css/src/b.css" />',
          '<link rel="stylesheet" href="/css/src/a.css" />'
        ];
        
        assert.equal(markup, imports.join('\n') + '\n');
      }
    },
    'when compiling a stylesheet with cyclic imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/a.css', 'concat', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only build one stylesheet': function (error, result, markup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/css/build/a.max.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a stylesheet with imports in compress mode': {
      topic: function () {
        compiler.compile('./test/support/web/css/src/a.css', 'compress', {
          server: {
            root: './test/support/web'
          },
          css: {
            output: './css/build'
          }
        }, this.callback);
      },
      'should only minify one script': function (error, result, markup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/css/build/a.min.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    }
  }
}).export(module);