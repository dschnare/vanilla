var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('JavaScriptCompiler').addBatch({
  'A JavaScriptCompiler': {
    'when compiling a script with no imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/d.js', 'debug', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only provide <script> elements for one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        assert.equal(scriptsMarkup, '<script src="/js/src/d.js" type="text/javascript"></script>\n');
      }
    },
    'when compiling a script with no imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/d.js', 'concat', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/js/build/d.max.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/e.js', 'debug', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only provide <script> elements for two scripts': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<script src="/js/src/d.js" type="text/javascript"></script>',
          '<script src="/js/src/e.js" type="text/javascript"></script>'
        ];
        
        assert.equal(scriptsMarkup, imports.join('\n') + '\n');
      }
    },
    'when compiling a script with imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/e.js', 'concat', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/js/build/e.max.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with cyclic imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/a.js', 'debug', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only provide <script> elements for each unique script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<script src="/js/src/lib/c.js" type="text/javascript"></script>',
          '<script src="/js/src/b.js" type="text/javascript"></script>',
          '<script type="text/javascript">var exports;</script>',
          '<script src="/js/src/a.js" type="text/javascript"></script>',
          '<script type="text/javascript">var a = exports;</script>'
        ];
        
        assert.equal(scriptsMarkup, imports.join('\n') + '\n');
      }
    },
    'when compiling a script with cyclic imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/a.js', 'concat', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/js/build/a.max.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with imports in compress mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/src/a.js', 'compress', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './js/build'
          }
        }, this.callback);
      },
      'should only minify one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/js/build/a.min.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    }
  }
}).export(module);