var uglifyjs, wrench, fs, path, createStringReader, createTokenizer; 

uglifyjs = require('uglify-js2');
wrench = require('wrench');
fs = require('fs');
path = require('path');
createStringReader = require('../../stringreader').createStringReader;
createTokenizer = require('./tokenizer').createTokenizer;

/////////
// API //
/////////

/*
 * mode=compress (concatenate all includes and minify)
 * mode=debug (enumerate all includes and create a <scritp> elements for each)
 * mode={anything else} (concatenate all includes without minifying)[default]
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
        outputfilename = path.join(options.js.output, path.basename(file, '.js') + '.min.js');
        
        (options.minify || minify)(output, function (error, output) {
          if (error) {
            callback(error);
          } else {
            wrench.mkdirSyncRecursive(options.js.output, parseInt('777', 8));
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
        outputfilename = path.join(options.js.output, path.basename(file));
        wrench.mkdirSyncRecursive(options.js.output, parseInt('777', 8));
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
        
        if (ext !== '.js') {
          importedFilename = path.join(path.dirname(importedFilename), path.basename(importedFilename, ext) + '.js');
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

function concatenate(imports, mode, root) {
  'use strict';
  
  switch (mode) {
    case 'debug':
      return imports.map(function (incl) {
        var out = [];
        
        if (isModule(incl.text)) {
          out.push('<script type="text/javascript">var exports;</script>');
          out.push('<script src="/' + path.relative(root, incl.filename) + '" type="text/javascript"></script>');
          out.push('<script type="text/javascript">var ' + path.basename(incl.filename, '.js') + ' = exports;</script>');
        } else {
          out.push('<script src="/' + path.relative(root, incl.filename) + '" type="text/javascript"></script>');
        }
        
        return out.join('\n');
      }).join('\n') + '\n';
      break;
    default:
      return imports.map(function (incl) {
        if (isModule(incl.text)) {
          return '/// FILE: ' + incl.filename + '\n\n' + wrapAsModule(path.basename(incl.filename, '.js'), incl.text);
        } else {
          return '/// FILE: ' + incl.filename + '\n\n' + incl.text;
        }
      }).join('\n\n');
  }
}

function isModule(script) {
  return !!script.match(/exports(\.[_a-z$][_a-z0-9$]*\s*=|\[[^\]]+\]\s*=)/i);
}

function wrapAsModule(id, script) {
  return 'var ' + id + ' = (function (exports) {\n' + script + '\n\nreturn exports; \n})({});'; 
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
    ////////////
    // Uglify //
    ////////////
    result = uglifyjs.minify(script, {
      warnings: true,
      fromString: true,
      mangle: true,
      compress: {
        dead_code: true,
        unused: true,
        join_vars: true
      }
    });
    callback(null, result.code);

    //////////////////////
    // Closure Compiler //
    //////////////////////
    // fs.writeFile('temp.js', script, {encoding:'utf8'}, function (error) {
    //   if (error) {
    //     callback(error);
    //   } else {
    //     exec('java -jar ./bin/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --warning_level QUIET --js temp.js', function (error, stdout, stderr) {
    //       if (error) {
    //         callback(error);
    //       } else {
    //         fs.unlink('temp.js');
    //         callback(null, stdout+'');
    //       }
    //     }); 
    //   }
    // });
  }
}