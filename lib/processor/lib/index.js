var _, HOGAN, FS;

_ = require('underscore');
HOGAN = require('beefcake.js');
FS = require('fs');

// #include path/to/file.ext
// OR
// #include path/to/file.ext
//  block
// #/include
//
// include()
// include(wrap)
// include(phase, wrap)
exports.include = function (phase, wrap) {
  if (typeof phase === 'function') {
    wrap = phase;
    phase = '';
  }
  
  return {
    phase: phase,
    name: 'include',
    process: function (file, options, helpers, callback) {
      var prefix, suffix;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      wrap = typeof wrap === 'function' ? wrap : function (a, b) {
        return b.content;
      };
      
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
          helpers.processFile(resourcePath, {meta: meta}, function (error, fileResult) {
            var wrapped;
            
            if (error) {
              callback(error);
            } else {
              if (wrap.length === 4) {
                wrap(file, fileResult, helpers, function (error, result) {
                  if (error) {
                    callback(error);
                  } else {
                    file.content = file.content.substring(0, directive.open.begin) + result + file.content.substring(end);
                    execute(directive.open.begin + result.length);
                  }
                });
              } else {
                wrapped = wrap(file, fileResult, helpers);
                file.content = file.content.substring(0, directive.open.begin) + wrapped + file.content.substring(end);
                execute(directive.open.begin + wrapped.length); 
              }
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
        var directive = helpers.readBlockDirective('partial', prefix, suffix, file.content, fromIndex);
        
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
          
          file.content = file.content.substring(0, directive.open.end) + file.content.substring(directive.close.end);
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
      var meta, prefix, suffix, files;

      meta = options.meta = options.meta || {};
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      files = this.files;
      
      files.push(meta);
      
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
          
          file.content = file.content.substring(0, directive.open.end) + file.content.substring(directive.close.end);
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
        
        directive = helpers.readBlockDirective('block', prefix, suffix, file.content, fromIndex || 0);
        
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
          
          _.where(blockExtensions, {blockName: directive.open.text}).forEach(function (blockExtension) {
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
          });
          
          file.content = file.content.substring(0, directive.open.begin) + body + file.content.substring(end);
          execute(directive.open.begin + body.length);
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
      var directive, suffix, prefix, blockExtensions;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      blockExtensions = options.blockExtensions = options.blockExtensions || [];
      
      directive = helpers.readBlockDirective('replace', prefix, suffix, file.content);
      
      if (directive.open.empty) {
        callback(null, file);
      } else if (directive.open.text) {
        blockExtensions.push({
          blockName: directive.open.text,
          body: directive.body || ''
        });
      } else {
        file.content = file.content.substring(0, directive.open.begin) + file.content.substring(directive.open.end);
        callback(null, file);
      }
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
      var directive, suffix, prefix, blockExtensions;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      blockExtensions = options.blockExtensions = options.blockExtensions || [];
      
      directive = helpers.readBlockDirective('append', prefix, suffix, file.content);
      
      if (directive.open.empty) {
        callback(null, file);
      } else if (directive.open.text) {
        blockExtensions.push({
          blockName: directive.open.text,
          body: directive.body || ''
        });
      } else {
        file.content = file.content.substring(0, directive.open.begin) + file.content.substring(directive.open.end);
        callback(null, file);
      }
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
      var directive, suffix, prefix, blockExtensions;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      blockExtensions = options.blockExtensions = options.blockExtensions || [];
      
      directive = helpers.readBlockDirective('prepend', prefix, suffix, file.content);
      
      if (directive.open.empty) {
        callback(null, file);
      } else if (directive.open.text) {
        blockExtensions.push({
          blockName: directive.open.text,
          body: directive.body || ''
        });
      } else {
        file.content = file.content.substring(0, directive.open.begin) + file.content.substring(directive.open.end);
        callback(null, file);
      }
    }
  };
};

// #extends path/to/file.ext
exports.extends = function (phase) {
  return {
    phase: phase,
    name: 'extends',
    process: function (file, options, helpers, callback) {
      var directive, suffix, prefix, resourcePath;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      directive = helpers.readDirective('extends', prefix, suffix, file.content);
      
      if (directive.empty) {
        callback(null, file);
      } else if (directive.text) {
        resourcePath = helpers.resolvePath(file.src, directive.text);
        
        if (FS.existsSync(resourcePath)) {
          helpers.processFile(resourcePath, {
            meta: options.meta || {},
            blockExtensions: options.blockExtensions || []
          }, function (error, result) {
            if (error) {
              callback(error);
            } else {
              file.content = result.content;
              callback(null, file);
            }
          });
        } else {
          callback(new Error('Extended file does not exist: ' + resourcePath));
        }
      } else {
        file.content = file.content.substring(0, directive.begin) + file.content.substring(directive.end);
        callback(null, file);
      }
    }
  };
};

// Interpolate files using Hogan+Beefcake.
exports.interpolation = function (phase) {
  return {
    phase: phase,
    name: 'interpolation',
    process: function (file, options, helpers, callback) {
      file.content = HOGAN.compile(file.content).render(options.meta || {}, options.partials || {});
      callback(null, file);
    }
  };
};