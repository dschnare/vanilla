var util, wrench, fs, path, createStringReader, createTokenizer, vanillaCompiler;

util = require('../../util');
wrench = require('wrench');
fs = require('fs');
path = require('path');
vanillaCompiler = require('../../../index');
createStringReader = require('../../stringreader').createStringReader;
createTokenizer = require('./tokenizer').createTokenizer;
Hogan = require('beefcake.js');

/////////
// API //
/////////

// compile(file, mode, options, callback)
exports.compile = function (file, mode, options, callback) {
  'use strict';
  file = path.resolve(file);
  options = extendOptions(options);
  
  if (typeof callback !== 'function') callback = function () {};
  
  fs.readFile(file, 'utf8', function (error, text) {
    var result;
    
    if (!error) {
      try {
        result = getFileData(text);
        text = result.text;
        options.html.context = util.mixin(options.html.context, result.json);
      } catch (err) {
        error = err;
      }
    }
    
    if (error) {
      callback(error);
    } else {
      parseIncludes(file, text, mode, options, function (error, text) {
        if (error) {
          callback(error);
        } else {
          parseExtends(text, mode, options, file, function (error, result) {
            var outputfilename;
            
            if (error) {
              callback(error);
            } else if (options.html.including) {
              callback(null, result);
            } else {
              outputfilename = util.resolvePath(options.projectRoot, options.webRoot, file, '.html');
              wrench.mkdirSyncRecursive(path.dirname(outputfilename), parseInt('777', 8));
              result = Hogan.render(result, options.html.context, options.html.partials || {});
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
    }
  });
};


//////////////////////
// Helper Functions //
//////////////////////

function getFileData(text) {
  'use strict';
  
  var stringReader, tokenizer, token, startToken, result;
  
  stringReader = createStringReader(text);
  tokenizer = createTokenizer(stringReader);
  result = {json:{}, text:text};
  
  token = tokenizer.next();
  while (token.name) {
    if (token.name === 'data') {
      if (token.closing) {
        if (!startToken) {
          throw new Error('Malformed HTML: Expected a <v:data>, closing element encountered.');
        }
        
        result.json = JSON.parse(text.substring(startToken.end, token.start).trim());
        result.text = text.substring(0, startToken.start) + text.substring(token.end);
        
        break;
      } else {
        if (startToken) {
          throw new Error('Malformed HTML, unbalanced <v:data></v:data> elements.');
        }
        startToken = token;
      }
    }
    
    token = tokenizer.next();
  }
  
  return result;
}

function parseIncludes(file, text, mode, options, callback) {
  var includes = getIncludes(file, text);
  expandIncludes(text, includes, mode, options, function (error, text) {
    if (error) {
      callback(error);
    } else {
      callback(null, text);
    }
  });
}

function getIncludes(filename, text) {
  'use strict';
  var includes, types, typeExt, stringReader, tokenizer, token, includedFilename, ext;
  
  includes = [];
  types = ['include','stylesheet','script'];
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
  
  return includes;
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
      line = util.getLineWithIndex(text, incl.token.start);
      vanillaCompiler.compile(incl.filename, mode, options, function (error, result, markup) {
        if (error) {
          callback(error);
        } else {
          switch (incl.token.name) {
            case 'include':
              markup = result;
              break;
            case 'script':
              markup = markup || '<script src="/' + path.relative(options.webRoot, incl.filename)+ '" type="text/javascript"></script>';
              break;
            case 'stylesheet':
              markup = markup || '<link href="/' + path.relative(options.webRoot, incl.filename) + '" rel="stylesheet" />';
              break;
          }
            
          text = util.replaceLine(text, line, markup);
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




// --- All functions from this point on deal with handling <v:extends> and <v:blocks>

function parseExtends(text, mode, options, filename, callback) {
  var extendsTokens, extendsToken, blocks, layoutFilename, partials;
  
  extendsTokens = getExtendsTokens(text);
  if (extendsTokens.length === 1) {
    extendsToken = extendsTokens[0];
    
    if (!extendsToken.attributes.file) {
      callback(new Error('Expected <v:extends> to have a file attribute.'));
      return;
    }
    
    text = util.replaceLine(text, util.getLineWithIndex(text, extendsToken.start));
    try { blocks = enumerateBlocks(text); } catch (error) { callback(error); return; }
    applyChildBlocks(blocks, options.html.blocks);
    
    // Set partials before we extend options so that current
    // execution of the compiler will get access to the partials
    // when set by any layout in the hierarchy.
    partials = options.html.partials = options.html.partials || {};
    Object.keys(blocks).forEach(function (name) {
      partials[name] = blocks[name].body;
    });
    
    options = extendOptions(options);
    options.html.including = true;
    options.html.blocks = blocks;
    
    layoutFilename = path.resolve(path.dirname(filename), extendsToken.attributes.file);
    
    exports.compile(layoutFilename, mode, options, callback);
  } else if (extendsTokens.length > 1) {
    callback(new Error('HTML templates only support one <v:extends> token.'));
  } else {
    try { blocks = enumerateBlocks(text); } catch (error) { callback(error); return; }
    applyChildBlocks(blocks, options.html.blocks);
    
    partials = options.html.partials = options.html.partials || {};
    Object.keys(blocks).forEach(function (name) {
      partials[name] = blocks[name].body;
    });
    
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
            startToken: token
          };
        }
        
        if (block) {
          block.endToken = token;
          block.body = text.substring(block.startToken.end, block.endToken.start);
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
            startToken: token
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
    text = text.substring(0, block.startToken.start) + block.body + text.substring(block.endToken.end);
  });
  return text;
}