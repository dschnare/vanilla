var yuicompressor, wrench, fs, path, createStringReader, createTokenizer, util;

yuicompressor = require('yuicompressor');
wrench = require('wrench');
fs = require('fs');
path = require('path');
createStringReader = require('../../stringreader').createStringReader;
createTokenizer = require('./tokenizer').createTokenizer;
util = require('../../util');

/////////
// API //
/////////

/*
 * mode=compress (concatenate all imports and minify)
 * mode=debug (enumerate all imports and create a <scritp> elements for each)
 * mode={anything else} (concatenate all imports without minifying)[default]
 */
exports.compile = function (file, mode, options, callback) {
  'use strict';
  file = path.resolve(file);
  
  if (typeof callback !== 'function') callback = function () {};
  
  getImports(file, function (error, imports) {
    var output, outputfilename;

    if (error) {
      callback(error);
    } else {
      output = concatenate(imports, mode, options.webRoot);
      
      if (mode === 'compress') {
        output = processDirectives(output);
        outputfilename = util.resolvePath(options.projectRoot, options.webRoot, file, '.min.js');
        
        (options.js.minify || minify)(output, function (error, output) {
          if (error) {
            callback(error);
          } else {
            wrench.mkdirSyncRecursive(path.dirname(outputfilename), parseInt('777', 8));
            fs.writeFile(outputfilename, output, function (error) {
              if (error) {
                callback(error);
              } else {
                callback(null, outputfilename);
              }
            });
          }
        });
      } else if (mode === 'debug') {
        callback(null, '', output);
      } else {
        outputfilename = util.resolvePath(options.projectRoot, options.webRoot, file, '.max.js');
        wrench.mkdirSyncRecursive(path.dirname(outputfilename), parseInt('777', 8));
        fs.writeFile(outputfilename, output, function (error) {
          if (error) {
            callback(error);
          } else {
            callback(null, outputfilename);
          }
        });
      }
    }
  });
};

//////////////////////
// Helper Functions //
//////////////////////

// getImports(filename, callback)
// getImports(filename, imports, visited, callback)
function getImports(filename, imports, visited, callback) {
  'use strict';
  var alreadyVisited;

  if (typeof imports === 'function') {
    callback = imports;
    imports = [];
  }

  if (!Array.isArray(imports)) {
    imports = [];
  }
  
  if (!Array.isArray(visited)) {
    visited = [];
  }

  alreadyVisited = visited.indexOf(filename) >= 0;

  if (alreadyVisited) {
    callback(null, imports);
    return;
  }
  
  visited.push(filename);
  
  /////
  
  fs.readFile(filename, 'utf8', function (error, scriptText) {
    var stringReader, tokenizer;
    
    if (error) {
      callback(error);
      return;
    }
    
    stringReader = createStringReader(scriptText);
    tokenizer = createTokenizer(stringReader);
    
    function next() {
      var token, importedFilename, ext;
      
      token = tokenizer.next();
      
      if (token.name === 'import') {
        importedFilename = path.resolve(path.dirname(filename), token.value);
        ext = path.extname(importedFilename);

        if (!ext && fs.statSync(importedFilename).isDirectory()) {
          importedFilename = path.join(importedFilename, 'index.js');
        } else if (ext !== '.js') {
          importedFilename = path.join(path.dirname(importedFilename), path.basename(importedFilename, ext));
          importedFilename += '.js';
        }
        
        getImports(importedFilename, imports, visited, function (error, imports) {
          if (error) {
            callback(error);
          } else {
            next();
          }
        });
      } else {
        imports.push({
          filename: filename,
          text: scriptText
        });
        
        callback(null, imports);
      }
    }
    
    next();
  });
}

function concatenate(imports, mode, webRoot) {
  'use strict';
  
  switch (mode) {
    case 'debug':
      return imports.map(function (incl) {
        return '<script src="/' + path.relative(webRoot, incl.filename).replace(/\\/g, '/') + '" type="text/javascript"></script>';
      }).join('\n') + '\n';
      break;
    default:
      return imports.map(function (incl) {
        return '/// FILE: ' + incl.filename + '\n\n' + incl.text;
      }).join('\n\n');
  }
}

function processDirectives(script) {
  // Debug directives will be stripped from the script.
  // TODO: Process debug directives properly via tokenizer.
  script = script.replace(/\/\/#DEBUG\s+(.|\s)+?\/\/#ENDDEBUG/ig, '');
  
  return script;
}

function minify(script, callback) {
  'use strict';
  var child, out, err, result;

  if (script) {
    yuicompressor.compress(script, {
      charset: 'utf8',
      type: 'js'
    }, function (error, data, extra) {
      if (error) {
        callback(error);
      } else {
        callback(null, data);
      }
    });
  }
}