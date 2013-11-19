var path, util, glob;

path = require('path');
util = require('./lib/util');
glob = require('glob');

/////////
// API //
/////////

exports.compile = function (filepath, mode, options, callback) {
  var optionsFilepath, files;
  
  files = glob.sync(filepath);
  
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (typeof options === 'string') {
    optionsFilepath = path.resolve(options);
    options = require(path.relative(__filename, path));
  }
  
  options = util.pojo(options, {
    projectRoot: './src',
    webRoot: './web',
    js: {},
    css: {},
    html: {}
  });
  
  options.projectRoot = optionsFilepath ? path.dirname(optionsFilepath) : path.resolve(options.projectRoot);
  options.webRoot = path.resolve(optionsFilepath ? path.dirname(optionsFilepath) : path.resolve('.'), options.webRoot);
  
  function compileNextFile(completeArgs) {
    if (files.length) {
      var filepath, compiler;
      
      filepath = files.pop();
      compiler = selectVanillaCompiler(path.extname(filepath));
      if (compiler) {
        compiler.compile(filepath, mode, options, function (error) {
          if (error) {
            callback(error);
          } else {
            compileNextFile(([]).slice.call(arguments));
          }
        });
      }
    } else {
      callback.apply(undefined, completeArgs);
    }
  }

  compileNextFile([]);
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