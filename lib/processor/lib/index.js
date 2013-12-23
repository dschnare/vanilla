var _, HOGAN, FS, PATH;

_ = require('underscore');
HOGAN = require('beefcake.js');
FS = require('fs');
PATH = require('path');

// #include path/to/file.ext
// OR
// #include path/to/file.ext
//  block
// #/include
//
// include()
// include(wrap)
// include(phase, options)
// include(phase, wrap)
// include(phase, options, wrap)
//
// Options:
//  moduleEntryPoint: The basename for the file to include if an include path is a directory.
//
// Example (js files):
// pipeline.add(processorLibrary.include('default', {moduleEntryPoint: 'index.js'}));
exports.include = function (phase, options, wrap) {
  var processorOptions;

  // include(wrap)
  if (typeof phase === 'function') {
    wrap = phase;
    phase = '';
    options = {};
  // include(phase, wrap)
  } else if (typeof options === 'function') {
    wrap = options;
    options = {};
  // include(options, wrap)
  } else if (Object(phase) === phase) {
    options = phase;
    phase = '';
  }

  wrap = typeof wrap === 'function' ? wrap : function (a, b) {
    return b.content;
  };

  processorOptions = options;
  
  return {
    phase: phase,
    name: 'include',
    process: function (file, options, helpers, callback) {
      var prefix, suffix;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      
      function execute(fromIndex) {
        var directive, data, resourcePath, end;
        
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
              data = (new Function('return ' + directive.body)).call();
              /*jshint evil:false */
            } catch (error) {
              callback(error);
              return;
            }
          }
          
          resourcePath = helpers.resolvePath(file.src, directive.open.text);

          if (FS.statSync(resourcePath).isDirectory()) {
            if (processorOptions.moduleEntryPoint) {
              resourcePath = PATH.join(resourcePath, PATH.basename(processorOptions.moduleEntryPoint));
            } else {
              callback(new Error('Cannot include a directory.'));
              // Exit.
              return;
            }
          }

          helpers.processFile(resourcePath, file, {data: data}, function (error, fileResult) {
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

      partials = file.partials = file.partials || {};
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

// #data
// JS block
// #/data
// OR
// #data propertyname
// value
// #/data
exports.data = function (phase) {
  return {
    phase: phase,
    name: 'data',
    files: [],
    process: function (file, options, helpers, callback) {
      var data, prefix, suffix, files;

      data = file.data = file.data || {};
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      files = this.files;

      data.src = file.src.replace(/\\/g, '/');
      data.dest = file.dest.replace(/\\/g, '/');
      data.files = files;
      
      files.push(data);
      
      function execute(fromIndex) {
        var directive;
        
        directive = helpers.readBlockDirective('data', prefix, suffix, file.content, fromIndex || 0);
        
        if (directive.open.empty) {
          _.each(data, function (v, k) {
            if (typeof v === 'function') {
              data[k] = v.bind(data);
            }
          });
          
          callback(null, file);
        } else if (directive.close.empty) {
          callback(new Error('Expected data directive to have a closing tag.'));
        } else {
          if (directive.open.text) {
            data[directive.open.text] = directive.body;
          } else {
            try {
              /*jshint evil:true */
              _.extend(data, (new Function('return ' + directive.body)).call());
              /*jshint evil:false */
            } catch (error) {
              callback(error);
              return;
            }
          }
          
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring(directive.close.end);
          execute(directive.open.begin);
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
      var suffix, prefix, blockExtensions;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      blockExtensions = file.blockExtensions = file.blockExtensions || [];

      function execute(fromIndex) {
        var directive;

        directive = helpers.readBlockDirective('replace', prefix, suffix, file.content, fromIndex || 0);
        
        if (directive.open.empty) {
          callback(null, file);
        } else if (directive.open.text) {
          blockExtensions.push({
            blockName: directive.open.text,
            body: directive.body || '',
            type: 'replace'
          });
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring((directive.close || directive.open).end);
          execute(directive.open.begin);
        } else {
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring((directive.close || directive.open).end);
          execute(directive.open.begin);
        }
      }

      execute();
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
      var suffix, prefix, blockExtensions;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      blockExtensions = file.blockExtensions = file.blockExtensions || [];
      
      function execute(fromIndex) {
        var directive;
        directive = helpers.readBlockDirective('append', prefix, suffix, file.content, fromIndex || 0);
        
        if (directive.open.empty) {
          callback(null, file);
        } else if (directive.open.text) {
          blockExtensions.push({
            blockName: directive.open.text,
            body: directive.body || '',
            type: 'append'
          });
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring((directive.close || directive.open).end);
          execute(directive.open.begin);
        } else {
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring((directive.close || directive.open).end);
          execute(directive.open.begin);
        }
      }

      execute();
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
      blockExtensions = file.blockExtensions = file.blockExtensions || [];
      
      function execute(fromIndex) {
        var directive;
        directive = helpers.readBlockDirective('prepend', prefix, suffix, file.content, fromIndex || 0);
        
        if (directive.open.empty) {
          callback(null, file);
        } else if (directive.open.text) {
          blockExtensions.push({
            blockName: directive.open.text,
            body: directive.body || '',
            type: 'prepend'
          });
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring((directive.close || directive.open).end);
          execute(directive.open.begin);
        } else {
          file.content = file.content.substring(0, directive.open.begin) + file.content.substring((directive.close || directive.open).end);
          execute(directive.open.begin);
        }
      }

      execute();
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
          helpers.processFile(resourcePath, file, {
            data: options.data ? helpers.extend({}, options.data, file.data) : file.data,
            partials: options.partials ? helpers.extend({}, options.partials, file.partials) : file.partials,
            blockExtensions: options.blockExtensions ? options.blockExtensions.concat(file.blockExtensions) : file.blockExtensions
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
      file.content = HOGAN.compile(file.content).render(options.data ? helpers.extend({}, file.data, options.data) : file.data || {}, options.partials ? helpers.extend({}, file.partials, options.partials) : file.partials || {});
      callback(null, file);
    }
  };
};