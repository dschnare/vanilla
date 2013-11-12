var path, util;

path = require('path');
util = require('./lib/util');

/////////
// API //
/////////

exports.compile = function (filepath, mode, options, callback) {
  var optionsFilepath, compiler;
  
  if (typeof callback !== 'function') callback = function () {};
  
  if (typeof options === 'string') {
    optionsFilepath = path.resolve(options);
    options = require(path.relative(__filename, path));
  }
  
  options = util.pojo(options, {
    server: {
      root: './'
    },
    js: {
      output: './build/js'
    },
    css: {
      output: './build/css'
    },
    html: {
      output: './build'
    }
  });
  
  options.server.root = path.resolve(optionsFilepath || path.resolve('.'), options.server.root);
  options.js.output = path.resolve(options.server.root, options.js.output);
  options.css.output = path.resolve(options.server.root, options.css.output);
  options.html.output = path.resolve(options.server.root, options.html.output);
  
  compiler = selectVanillaCompiler(path.extname(filepath));
  if (compiler) {
    compiler.compile(filepath, mode, options, callback);
  }
};

//////////////////////
// Helper Functions //
//////////////////////

function selectVanillaCompiler(fileExtension) {
  switch (fileExtension.replace('.', '')) {
    case 'js': return require('./lib/compiler/js');
    case 'css': return require('./lib/compiler/css');
    case 'html': return require('./lib/compiler/html');
  }
  
  return null;
}