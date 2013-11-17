var yuicompressor, wrench, fs, path, createStringReader, createTokenizer; 

yuicompressor = require('yuicompressor');
wrench = require('wrench');
fs = require('fs');
path = require('path');
createStringReader = require('../../stringreader').createStringReader;
createTokenizer = require('./tokenizer').createTokenizer;

/////////
// API //
/////////

/*
 * mode=compress (concatenate all imports and minify)
 * mode=debug (enumerate all imports and create a <link> elements for each)
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
      output = concatenate(imports, mode, options.server.root);
      
      if (mode === 'compress') {
        output = processDirectives(output);
        outputfilename = path.join(options.css.output, path.basename(file, '.css') + '.min.css');
        
        (options.minify || minify)(output, function (error, output) {
          if (error) {
            callback(error);
          } else {
            wrench.mkdirSyncRecursive(options.css.output, parseInt('777', 8));
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
        outputfilename = path.join(options.css.output, path.basename(file, '.css') + '.max.css');
        wrench.mkdirSyncRecursive(options.css.output, parseInt('777', 8));
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
  
  fs.readFile(filename, 'utf8', function (error, stylesheet) {
    var stringReader, tokenizer;
    
    if (error) {
      callback(error);
      return;
    }
    
    stringReader = createStringReader(stylesheet);
    tokenizer = createTokenizer(stringReader);
    
    function next() {
      var token, importedFilename, ext;
      
      token = tokenizer.next();
      
      if (token.name === 'import') {
        importedFilename = path.resolve(path.dirname(filename), token.value);
        ext = path.extname(importedFilename);
        
        if (ext !== '.css') {
          importedFilename = path.join(path.dirname(importedFilename), path.basename(importedFilename, ext) + '.css');
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
          text: stylesheet
        });
        
        callback(null, imports);
      }
    }
    
    next();
  });
}

function concatenate(imports, mode, root) {
  'use strict';
  
  switch (mode) {
    case 'debug':
      return imports.map(function (incl) {
        // NOTE: This will break all relative URLs in the CSS (i.e. for images)
        return '<link rel="stylesheet" href="/' + path.relative(root, incl.filename) + '" />';
      }).join('\n') + '\n';
      break;
    default:
      return imports.map(function (incl) {
        return '/* FILE: ' + incl.filename + ' */\n\n' + incl.text;
      }).join('\n\n');
  }
}

function processDirectives(stylesheet) {
  // Debug directives will be stripped from the stylesheet.
  // TODO: Process debug directives properly via tokenizer.
  stylesheet = stylesheet.replace(/\/\/@@DEBUG\s+(.|\s)+?\/\/@@ENDDEBUG/ig, '');
  
  return stylesheet;
}

function minify(stylesheet, callback) {
  'use strict';
  var child, out, err, result;

  if (stylesheet) {
    yuicompressor.compress(stylesheet, {
      charset: 'utf8',
      type: 'css'
    }, function (error, data, extra) {
      if (error) {
        callback(error);
      } else {
        callback(null, data);
      }
    });
  }
}