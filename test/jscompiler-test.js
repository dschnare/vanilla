var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('JavaScriptCompiler').addBatch({
  'A JavaScriptCompiler': {
    'when compiling a script with no imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/d.js', 'debug', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build'
          }
        }, this.callback);
      },
      'should only provide <script> elements for one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        assert.equal(scriptsMarkup, '<script src="/js/d.js" type="text/javascript"></script>\n');
      }
    },
    'when compiling a script with no imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/d.js', 'concat', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/js/d.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/e.js', 'debug', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should only provide <script> elements for one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<script src="/js/d.js" type="text/javascript"></script>',
          '<script src="/js/e.js" type="text/javascript"></script>'
        ];
        
        assert.equal(scriptsMarkup, imports.join('\n') + '\n');
      }
    },
    'when compiling a script with imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/e.js', 'concat', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/js/e.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with cyclic imports in debug mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/a.js', 'debug', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should only provide <script> elements for each unique script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<script src="/js/lib/c.js" type="text/javascript"></script>',
          '<script src="/js/b.js" type="text/javascript"></script>',
          '<script type="text/javascript">var exports;</script>',
          '<script src="/js/a.js" type="text/javascript"></script>',
          '<script type="text/javascript">var a = exports;</script>'
        ];
        
        assert.equal(scriptsMarkup, imports.join('\n') + '\n');
      }
    },
    'when compiling a script with cyclic imports in concat mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/a.js', 'concat', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/js/a.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with imports in compress mode': {
      topic: function () {
        compiler.compile('./test/support/web/js/a.js', 'compress', {
          server: {
            root: './test/support/web'
          },
          js: {
            output: './build/js'
          }
        }, this.callback);
      },
      'should only minify one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/web/build/js/a.min.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    }
  }
}).export(module);