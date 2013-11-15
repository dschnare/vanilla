var wrench, fs, path, createStringReader, createTokenizer, vanillaCompiler;

wrench = require('wrench');
fs = require('fs');
path = require('path');
vanillaCompiler = require('../../../index');
createStringReader = require('../../stringreader').createStringReader;
createTokenizer = require('./tokenizer').createTokenizer;

/////////
// API //
/////////

// compile(file, mode, options, callback)
// compile(file, mode, options, child, callback)
exports.compile = function (file, mode, options, child, callback) {
  // TODO: Use child to reference its blocks and meta data (if child is defined).
  parseIncludes(file, mode, options, function (error, text) {
    // TODO: Handle extends tokens.
      // - enumerate blocks
      // - apply child blocks (if child is defined)
      // - compile parent as template
  });
};


//////////////////////
// Helper Functions //
//////////////////////

function parseIncludes(file, mode, options callback) {
  getIncludes(file, function (error, text, includes) {
    if (error) {
      callback(error);
    } else {
       expandIncludes(text, includes, mode, options function (error, text) {
         if (error) {
          callback(error);
         } else {
          callback(null, text);
         }
       });
    }
  });
}

function getIncludes(filename, callback) {
  'use strict';
  var includes, types, typeExt;
  
  includes = [];
  types = ['include','stylesheet','script'];
  
  fs.readFile(filename, 'utf8', function (error, text) {
    var stringReader, tokenizer, token, includedFilename, ext;
    
    if (error) {
      callback(error);
      return;
    }
    
    stringReader = createStringReader(text);
    tokenizer = createTokenizer(stringReader);

    token = tokenizer.next();
    
    while (token.name) {
      if (types.indexOf(token.name) >= 0) {
        includedFilename = path.resolve(path.dirname(filename), token.attributes.file || token.attributes.src);
        ext = path.extname(includedFilename);
        
        switch (token.name) {
          case 'include':
            typeExt = '.html';
            break;
          case 'stylesheet':
            typeExt = '.css';
            break;
          case 'script':
            typeExt = '.js';
            break;
        }
        
        if (ext !== typeExt) {
          includedFilename = path.join(path.dirname(includedFilename), path.basename(includedFilename, ext) + typeExt);
        }
        
        includes.push({
          filename: includedFilename,
          text: text,
          token: token
        });
      }
      
      token = tokenizer.next();
    }
    
    callback(null, text, includes);
  });
}

function expandIncludes(text, includes, mode, options, callback) {
  var text;
  
  if (!includes.length) {
    callback(null, text);
    return;
  }
  
  includes = includes.slice();
  
  function next() {
    var incl, line;
    
    if (includes.length) {
      incl = includes.pop();
      line = getLineWithIndex(text, incl.token.start);
      vanillaCompiler(incl.filename, mode, options, function (error, result, markup) {
        if (error) {
          callback(error);
        } else {
          switch (incl.token.name) {
            case 'include':
              markup = result;
              break;
            case 'script':
              markup = '<script src="' + path.relative(options.server.root, incl.filename)+ '" type="text/javascript"></script>';
              break;
            case 'stylesheet':
              markup = '<link href="' + path.relative(options.server.root, incl.filename) + '" rel="stylesheet" />';
              break;
          }
            
          text = text.substring(0, line.begin) + markup + '\n' + text.substring(line.end);  
          next();
        }
      });
    line = getLineWithIndex(incl.text, incl.token.start);
    } else {
      callback(null, text);
    }
  }
  
  next();
}

// TODO: Implement this function.
function getLineWithIndex(string, index) {
  return {
    begin: 0,
    end: 0
  };
}