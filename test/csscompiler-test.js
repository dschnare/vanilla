var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var compiler = require('./../index');

vows.describe('CSSCompiler').addBatch({
  'A CSSCompiler': {
    'when compiling a stylesheet with no imports in debug mode': {
      topic: function () {
        compiler.compile('./css/d.css', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only provide <link> elements for one stylesheet': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, '');
        assert.equal(markup, '<link rel="stylesheet" href="/../src/css/d.css" />\n');
      }
    },
    'when compiling a stylesheet with no imports in concat mode': {
      topic: function () {
        compiler.compile('./css/d.css', 'concat', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only build one stylesheet': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, path.resolve('./test/support/project/web/css/d.max.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a stylesheet with imports in debug mode': {
      topic: function () {
        compiler.compile('./css/e.css', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only provide <link> elements for two stylesheets': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, '');
        
        var imports = [
          '<link rel="stylesheet" href="/../src/css/d.css" />',
          '<link rel="stylesheet" href="/../src/css/e.css" />'
        ];
        
        assert.equal(markup, imports.join('\n') + '\n');
      }
    },
    'when compiling a stylesheet with imports in concat mode': {
      topic: function () {
        compiler.compile('./css/e.css', 'concat', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only build one stylesheet': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, path.resolve('./test/support/project/web/css/e.max.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a stylesheet with cyclic imports in debug mode': {
      topic: function () {
        compiler.compile('./css/a.css', 'debug', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only provide <link> elements for each unique stylesheet': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, '');
        
        var imports = [
          '<link rel="stylesheet" href="/../src/css/theme/c.css" />',
          '<link rel="stylesheet" href="/../src/css/b.css" />',
          '<link rel="stylesheet" href="/../src/css/a.css" />'
        ];
        
        assert.equal(markup, imports.join('\n') + '\n');
      }
    },
    'when compiling a stylesheet with cyclic imports in concat mode': {
      topic: function () {
        compiler.compile('./css/a.css', 'concat', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only build one stylesheet': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, path.resolve('./test/support/project/web/css/a.max.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    },
    'when compiling a stylesheet with imports in compress mode': {
      topic: function () {
        compiler.compile('./css/a.css', 'compress', {
          projectRoot: './test/support/project/src',
          webRoot: './test/support/project/web'
        }, this.callback);
      },
      'should only minify one script': function (error, result, markup) {
        if (error) throw error;
        assert.equal(result, path.resolve('./test/support/project/web/css/a.min.css'));
        assert(!markup);
        assert(fs.existsSync(result));
      }
    }
  }
}).export(module);