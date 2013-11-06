var fs = require('fs');
var path = require('path');
var createStringReader = require('./stringreader').createStringReader;
var createTokenizer = require('./javascripttokenizer').createTokenizer;

exports.createCompiler = function () {
  return {
    compile: function (file, mode, callback) {
      // TODO: Implement this function.
    }
  };
};

// getImports(filename, callback)
// getImports(filename, includes, callback)
// getImports(filename, includes, visited, callback)
function getImports(filename, imports, visited, callback) {
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
    var stringReader = createStringReader(scriptText);
    var tokenizer = createTokenizer(stringReader);
    
    function next() {
      var token = tokenizer.next();
      var importedFilename, ext;
      
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
          filename: importedFilename,
          text: scriptText
        });
        
        callback(null, imports);
      }
    }
    
    next();
  });
}