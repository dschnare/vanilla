var path, util, glob;

path = require('path');
util = require('./lib/util');
glob = require('glob');

/////////
// API //
/////////

// compile(filepath)
// compile(filepath, mode)
// compile(filepath, options)
// compile(filepath, callback)
// compile(filepath, mode, callback)
// compile(filepath, options, callback)
// compile(filepath, mode, options, callback)
exports.compile = function (filepath, mode, options, callback) {
  var optionsFilepath, files;
  
  // compile(filepath, callback)
  if (typeof mode === 'function') {
    callback = mode;
    mode = 'concat';
    options = {};
  }
  
  // compile(filepath, options, callback)
  if (Object(mode) === mode) {
    options = mode;
    mode = 'concat';
  }
  
  // compile(filepath, mode, callback)
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  if (typeof options === 'string') {
    optionsFilepath = path.resolve(options);
    options = require(path.relative(__filename, path));
  }
  
  if (typeof callback !== 'function') callback = function () {};
  
  options = util.pojo(options, {
    projectRoot: './src',
    webRoot: './web',
    js: {},
    css: {},
    html: {}
  });
  
  options.projectRoot = optionsFilepath ? path.dirname(optionsFilepath) : path.resolve(options.projectRoot);
  options.webRoot = path.resolve(optionsFilepath ? path.dirname(optionsFilepath) : path.resolve('.'), options.webRoot);
  
  files = glob.sync(filepath, {
    cwd: options.projectRoot,
    root: options.projectRoot
  });
  
  function compileNextFile(completeArgs) {
    if (files.length) {
      var filepath, compiler;
      
      filepath = files.pop();
      filepath = path.resolve(options.projectRoot, filepath);
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