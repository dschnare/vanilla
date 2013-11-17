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
exports.compile = function (file, mode, options, callback) {
  'use strict';
  var outputfilename, outputbasename;
  
  file = path.resolve(file);
  
  parseIncludes(file, mode, options, function (error, text) {
    if (error) {
      callback(error);
    } else {
      parseExtends(text, mode, options, file, function (error, result) {
        if (error) {
          callback(error);
        } else if (options.html.including) {
          callback(null, result);
        } else {
          outputbasename = path.basename(file, '.html');
          outputfilename = path.join(options.html.output, outputbasename + '.html');
          wrench.mkdirSyncRecursive(options.html.output, parseInt('777', 8));
          fs.writeFile(outputfilename, result, function (error) {
            if (error) {
              callback(error);
            } else {
              callback(null, outputfilename);
            }
          });
        }
      });
    }
  });
};


//////////////////////
// Helper Functions //
//////////////////////

function parseIncludes(file, mode, options, callback) {
  getIncludes(file, function (error, text, includes) {
    if (error) {
      callback(error);
    } else {
      expandIncludes(text, includes, mode, options, function (error, text) {
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
  options = extendOptions(options);
  options.html.including = true;
  
  function next() {
    var incl, line;
    
    if (includes.length) {
      incl = includes.pop();
      line = getLineWithIndex(text, incl.token.start);
      vanillaCompiler.compile(incl.filename, mode, options, function (error, result, markup) {
        if (error) {
          callback(error);
        } else {
          switch (incl.token.name) {
            case 'include':
              markup = result;
              break;
            case 'script':
              markup = markup || '<script src="/' + path.relative(options.server.root, incl.filename)+ '" type="text/javascript"></script>';
              break;
            case 'stylesheet':
              markup = markup || '<link href="/' + path.relative(options.server.root, incl.filename) + '" rel="stylesheet" />';
              break;
          }
            
          text = replaceLine(text, line, markup);
          next();
        }
      });
    } else {
      callback(null, text);
    }
  }
  
  next();
}

function extendOptions(options) {
  options = Object.create(options);
  options.html = Object.create(options.html);
  return options;
}

function getLineWithIndex(string, index) {
  var c, begin, end, i;
  
  c = string.charAt(index);
  begin = index;
  
  while (begin && c) {
    if (c === '\n' || !c) {
      begin += 1;
      break;
    } else {
      begin -= 1;
      c = string.charAt(begin);
    }
  }
  
  c = string.charAt(index);
  end = index;
  
  while (c) {
    if (c === '\n' || !c) {
      break;
    } else {
      end += 1;
      c = string.charAt(end);
    }
  }

  return {
    begin: begin,
    end: end
  };
}

function replaceLine(text, line, replacement) {
  return text.substring(0, line.begin) + (replacement || '') + '\n' + text.substring(line.end);  
}

function parseExtends(text, mode, options, filename, callback) {
  var extendsTokens, extendsToken, blocks, layoutFilename;
  
  extendsTokens = getExtendsTokens(text);
  if (extendsTokens.length === 1) {
    extendsToken = extendsTokens[0];
    text = replaceLine(text, getLineWithIndex(text, extendsToken.start));
    blocks = enumerateBlocks(text);
    applyChildBlocks(blocks, options.html.blocks);
    
    options = extendOptions(options);
    options.html.including = true;
    options.html.blocks = blocks;
    layoutFilename = path.resolve(path.dirname(filename), extendsToken.attributes.file);
    
    exports.compile(layoutFilename, mode, options, callback);
  } else if (extendsTokens.length > 1) {
    callback(new Error('HTML templates only support one <v:extends> token.'));
  } else {
    blocks = enumerateBlocks(text);
    applyChildBlocks(blocks, options.html.blocks);
    text = replaceBlocks(blocks, text);
    callback(null, text);
  }
}

function getExtendsTokens(text) {
  var stringReader, tokenizer, token, tokens;
  
  stringReader = createStringReader(text);
  tokenizer = createTokenizer(stringReader); 
  tokens = [];
  token = tokenizer.next();
    
  while (token.name) {
    if (token.name === 'extends') {
      tokens.push(token);
    }
    token = tokenizer.next();
  }
  
  return tokens;
}

function enumerateBlocks(text) {
  var stringReader, tokenizer, token, blocks, block;
  
  blocks = {};
  stringReader = createStringReader(text);
  tokenizer = createTokenizer(stringReader); 
 
  token = tokenizer.next();
  while (token.name) {
    if (token.name === 'block') {
      // </v:block> or <v:block /> encountered.
      if (token.closing) {
        // Self closing element. <v:block name="" />
        if (token.selfClosing) {
          if (!token.attributes.name) throw new Error('Malformed <v:block> token: Expected name attribute.');
          
          block = {
            name: token.attributes.name,
            operation: token.attributes.operation,
            beginLine: getLineWithIndex(text, token.start),
            bodyBegin: token.end
          };
        }
        
        if (block) {
          block.endLine = getLineWithIndex(text, token.start);
          block.bodyEnd = block.beginLine.begin === block.endLine.begin ? block.bodyBegin : token.start;
          block.body = text.substring(block.bodyBegin, block.bodyEnd);
          blocks[block.name] = block;
          block = null;
        } else {
          throw new Error('Unbalanced <v:block></v:block> tokens.');
        }
      // <v:block> encountered.
      } else {
        if (block) {
          throw new Error('Unbalanced <v:block></v:block> tokens.');
        } else if (token.attributes.name) {
          block = {
            name: token.attributes.name,
            operation: token.attributes.operation,
            beginLine: getLineWithIndex(text, token.start),
            bodyBegin: token.end
          };
        } else {
          throw new Error('Malformed <v:block> token: Expected name attribute.');
        }
      }
    }
    
    token = tokenizer.next();
  }
  
  return blocks;
}

function applyChildBlocks(blocks, child) {
  if (!child) return blocks;
  for (var name in child) {
    if (blocks[name]) {
      switch (child[name].operation) {
        case 'prepend':
          blocks[name].body = child[name].body + blocks[name].body;
          break;
        case 'append':
          blocks[name].body += child[name].body;
          break;
        default:
          blocks[name].body = child[name].body;    
      }
    }
  }
  return blocks;
}

function replaceBlocks(blocks, text) {
  var name, block;
  Object.keys(blocks).reverse().forEach(function (name) {
    var block = blocks[name];
    text = text.substring(0, block.beginLine.begin) + block.body + text.substring(block.bodyEnd);
  });
  return text;
}