var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('JavaScriptCompiler').addBatch({
  'A JavaScriptCompiler': {
    'when compiling a script with no imports in debug mode': {
      topic: function () {
        compiler.compile('./js/d.js', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only provide <script> elements for one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        assert.equal(scriptsMarkup, '<script src="/../src/js/d.js" type="text/javascript"></script>\n');
      }
    },
    'when compiling a script with no imports in concat mode': {
      topic: function () {
        compiler.compile('./js/d.js', 'concat', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/js/d.max.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with imports in debug mode': {
      topic: function () {
        compiler.compile('./js/e.js', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only provide <script> elements for two scripts': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<script src="/../src/js/d.js" type="text/javascript"></script>',
          '<script src="/../src/js/e.js" type="text/javascript"></script>'
        ];
        
        assert.equal(scriptsMarkup, imports.join('\n') + '\n');
      }
    },
    'when compiling a script with imports in concat mode': {
      topic: function () {
        compiler.compile('./js/e.js', 'concat', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/js/e.max.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with cyclic imports in debug mode': {
      topic: function () {
        compiler.compile('./js/a.js', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only provide <script> elements for each unique script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, '');
        
        var imports = [
          '<script src="/../src/js/lib/c.js" type="text/javascript"></script>',
          '<script src="/../src/js/b.js" type="text/javascript"></script>',
          '<script type="text/javascript">var exports;</script>',
          '<script src="/../src/js/a.js" type="text/javascript"></script>',
          '<script type="text/javascript">var a = exports;</script>'
        ];
        
        assert.equal(scriptsMarkup, imports.join('\n') + '\n');
      }
    },
    'when compiling a script with cyclic imports in concat mode': {
      topic: function () {
        compiler.compile('./js/a.js', 'concat', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only build one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/js/a.max.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a script with imports in compress mode': {
      topic: function () {
        compiler.compile('./js/a.js', 'compress', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only minify one script': function (error, result, scriptsMarkup) {
        assert(!error);
        assert.equal(result, path.resolve('./test/support/project/web/js/a.min.js'));
        assert(!scriptsMarkup);
        assert(fs.existsSync(result));
      }
    }
  }
}).export(module);