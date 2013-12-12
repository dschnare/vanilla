
// #include path/to/file.ext
// OR
// #include path/to/file.ext
//  block
// #/include
exports.include = function (phase) {
  return {
    phase: phase,
    name: 'include',
    process: function (file, options, helpers, callback) {
      var prefix, suffix;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      function execute(fromIndex) {
        var directive, meta, resourcePath, end;
        
        try {
          directive = helpers.readBlockDirective('include', prefix, suffix, file.content, fromIndex || 0);
        } catch (error) {
          callback(error);
          return;
        }
        
        if (directive.open.empty) {
          callback(null, file);
        } else {
          end = directive.open.end;
          
          if (!directive.close.empty) {
            end = directive.close.end;
            
            try {
              /*jshint evil:true */
              meta = (new Function('return ' + directive.body)).call();
              /*jshint evil:false */
            } catch (error) {
              callback(error);
              return;
            }
          }
          
          resourcePath = helpers.resolvePath(file.src, directive.open.text);
          helpers.processFile(resourcePath, {meta: meta}, function (error, result) {
            if (error) {
              callback(error);
            } else {
              file.content = file.content.substring(0, directive.open.begin) + result + file.content.substring(end);
              execute(directive.open.begin + result.length); 
            }
          });
        }
      }
      
      execute();
    }
  };
};

// #partial name
// body
// #/partial
exports.partial = function (phase) {
  return {
    phase: phase,
    name: 'partial',
    process: function (file, options, helpers, callback) {
      var partials, prefix, suffix;

      partials = options.partials = options.partials || {};
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      function execute(fromIndex) {
        directive = helpers.readBlockDirective('partial', prefix, suffix, content, fromIndex);
        
        if (directive.open.empty) {
          callback(null, file);
        } else {
          if (directive.open.text) {
            partials[directive.open.text] = directive.body;
          } else {
            try {
              /*jshint evil:true */
              _.extend(partials, (new Function('return ' + directive.body)).call());
              /*jshint evil:false */
            } catch (error) {
              callback(error);
              return;
            }
          }
          
          file.content = file.content.substring(0, directive.open.end) + content.substring(directive.close.end);
          execute(directive.open.end);
        }
      }      
      
      execute();
    }
  };
};

// #meta
// JS block
// #/meta
// OR
// #meta propertyname
// value
// #/meta
exports.meta = function (phase) {
  return {
    phase: phase,
    name: 'meta',
    files: [],
    process: function (file, options, helpers, callback) {
      var meta, prefix, suffix;

      meta = options.meta = options.meta || {};
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      this.files.push(meta);
      
      function execute(fromIndex) {
        var directive;
        
        directive = helpers.readBlockDirective('meta', prefix, suffix, file.content, fromIndex || 0);
        
        if (directive.open.empty) {
          _.each(meta, function (v, k) {
            if (typeof v === 'function') {
              meta[k] = v.bind(meta);
            }
          });
          
          meta.src = file.src;
          meta.dest = file.dest;
          meta.files = files;
          
          callback(null, file);
        } else {
          if (directive.open.text) {
            meta[directive.open.text] = directive.body;
          } else {
            try {
              /*jshint evil:true */
              _.extend(meta, (new Function('return ' + directive.body)).call());
              /*jshint evil:false */
            } catch (error) {
              callback(error);
              return;
            }
          }
          
          content = content.substring(0, directive.open.end) + content.substring(directive.close.end);
          execute(directive.open.end);
        }
      }
      
      execute();
    }
  };
};

// #block name
// OR
// #block name
//  body
// #/block
exports.block = function (phase) {
  return {
    phase: phase,
    name: 'block',
    process: function (file, options, helpers, callback) {
      var prefix, suffix, blockExtensions;
      
      blockExtensions = options.blockExtensions || [];
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      function execute(fromIndex) {
        var directive, blockExtension, end, body;
        
        directive = helpers.readDirective('block', prefix, suffix, file.content, fromIndex || 0);
        
        if (directive.open.empty) {
          callback(null, file);
        } else {
          if (directive.close.empty) {
            end = directive.open.end;
            body = '';
          } else {
            end = directive.close.end;
            body = directive.body;
          }
          
          blockExtension = _.where(blockExtensions, {blockName: directive.open.text});
          
          if (blockExtension) {
            switch (blockExtension.type) {
              case 'replace':
                body = blockExtension.body;
                break;
              case 'append':
                body += blockExtension.body;
                break;
              case 'prepend':
                body = blockExtension.body + body;
                break;
            }
          }
          
          file.content = file.content.substring(0, directive.open.end) + body + content.substring(end);
          execute(directive.open.end + body.length);
        }
      }
      
      execute();
    }
  };
};

// #replace blockname
//  body
// #/replace
exports.replace = function (phase) {
  return {
    phase: phase,
    name: 'replace',
    process: function (file, options, helpers, callback) {
      // TODO: Create blockExtensions on options
    }
  };
};

// #append blockname
//  body
// #/append
exports.append = function (phase) {
  return {
    phase: phase,
    name: 'append',
    process: function (file, options, helpers, callback) {
      // TODO: Create blockExtensions on options
    }
  };
};

// #prepend blockname
//  body
// #/prepend
exports.prepend = function (phase) {
  return {
    phase: phase,
    name: 'prepend',
    process: function (file, options, helpers, callback) {
      // TODO: Create blockExtensions on options
    }
  };
};

// #extend path/to/file.ext
exports.extend = function (phase) {
  return {
    phase: phase,
    name: 'extend',
    process: function (file, options, helpers, callback) {
      var directive, suffix, prefix, resourcePath;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      directive = vanilla.readDirective('extend', prefix, suffix, file.content);
      
      if (directive.open.empty) {
        callback(null, file);
      } else if (directive.open.text) {
        resourcePath = helpers.resolvePath(file.src, directive.open.text);
        helpers.processFile(resourcePath, {
          meta: options.meta || {},
          blockExtensions: options.blockExtensions || []
        }, function (error, result) {
          if (error) {
            callback(error);
          } else {
            file.content = result;
            callback(null, file);
          }
        });
      } else {
        file.content = file.content.substring(0, directive.open.begin) + file.content.substring(directive.open.end);
        callback(null, file);
      }
    }
  };
};