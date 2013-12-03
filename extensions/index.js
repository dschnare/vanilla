var path = require('path');
var yuicompressor = require('yuicompressor');

module.exports = {
  css: {
    directivePrefix: '/* #',
    directiveSuffix: '*/',
    minify: function (content, callback) {
      yuicompressor.compress(content, {
        charset: 'utf8',
        type: 'css'
      }, callback);
    }
  },
  js: {
  directivePrefix: '// #',
    minify: function (content, callback) {
      yuicompressor.compress(content, {
        charset: 'utf8',
        type: 'js'
      }, callback);
    }
  },
  html: {
    dest: './',
    directivePrefix: '<!-- #',
    directiveSuffix: '-->',
    reference: function (resourcePath, resourceContent) {
      switch (path.extname(resourcePath)) {
        case '.js':
          return '<script type="text/javascript" src="{src}"></script>'.replace('{src}', resourcePath);
          break;
        case '.json':
          resourceContent = 'window["' + path.basename(resourcePath, '.json') + '"] = ' + resourceContent + ';';
          return '<script type="text/javascript">{script}</script>'.replace('{script}', resourceContent);
          break;
        case '.css':
          return '<link rel="stylesheet" href="{href}" />'.replace('{href}', resourcePath);
          break;
        default:
          return resourceContent;
      }
    }
  }
};