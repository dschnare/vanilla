var 
// Modules
FS, PATH, _, PROCESSOR, ASYNC, GLOB, MKDIRP,
// Functions
processAndWriteFiles, processFiles, extendRec, 
getFileExtensions, getFileTypeOptions;

FS = require('fs');
PATH = require('path');
_ = require('underscore');
PROCESSOR = require('./lib/processor');
ASYNC = require('async');
GLOB = require('glob');
MKDIRP = require('mkdirp');

// options keys:
// defaults
// [extension keys]
exports.compile = function (files, options, callback) {
  var extensionDefaults, cache, context;
  
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Initialize the options object.
  
  options = options || {};
  
  options.defaults = _.extend({
    directivePrefix: '#',
    directiveSuffix: '\n',
    pipeline: PROCESSOR.defaultPipelines.defaults(PROCESSOR.makePipeline())
  }, options.defaults || {});
  
  extensionDefaults = {
    js: _.extend({}, options.defaults, {
      directivePrefix: '// #',
      directiveSuffix: '\n',
      pipeline: PROCESSOR.defaultPipelines.js(PROCESSOR.makePipeline())
    }),
    css: _.extend({}, options.defaults, {
      directivePrefix: '/* #',
      directiveSuffix: '*/',
      pipeline: PROCESSOR.defaultPipelines.css(PROCESSOR.makePipeline())
    }),
    html: _.extend({}, options.defaults, {
      directivePrefix: '<',
      directiveSuffix: '>',
      pipeline: PROCESSOR.defaultPipelines.html(PROCESSOR.makePipeline())
    })
  };
  
  // Ensure the file extensions have pipelines and that
  // builtin pipelines use their default pipelines.
  _.each(extensionDefaults, function (value, key) {
    var pipeline;
    
    if (options[key]) {
      pipeline = extensionDefaults[key].pipeline;
      options[key] = _.extend({}, extensionDefaults[key], value);
      
      if (typeof value.pipeline === 'function') {
        options[key].pipeline = value.pipeline(pipeline);
      } else if (!value.pipeline || typeof value.process !== 'function') {
        options[key].pipeline = pipeline;
      } 
    } else {
      options[key] = value;
    }
  });
  
  
  // Create the cache
  cache = (function () {
    var store = {};
    
    return {
      get: function (key) {
        return store[key];  
      },
      getOrSet: function (key, setter) {
        if (this.exists(key)) {
          return this.get(key);
        }
        
        return this.set(setter());
      },
      exists: function (key) {
        return !!store[key];
      },
      set: function (key, value) {
        return store[key] = value;
      }
    };
  }());
  
  
  files = exports.normalizeFiles(files);
  
  context = {
    cache: cache,
    extensions: options
  };
  
  context.helpers = PROCESSOR.generateHelpers(context, {
    processFiles: processFiles,
    processAndWriteFiles: processAndWriteFiles
  });
  context.helpers.extend = extendRec;
  
  processAndWriteFiles(files, context, callback);
};

exports.normalizeFiles = function (files) {
  var normalizedFiles;
  
  files = Array.isArray(files) ? files : [];
  normalizedFiles = [];
  
  files.forEach(function (file) {
    var matches;
    
    if (typeof file === 'string') {
      file = {src:file};
    }
    
    if (Object(file) === file && file.src) {
      if (typeof file.src !== 'string') {
        throw new Error('Expected file.src to be a string: ' + JSON.stringify(file.src));
      }
      file.src = PATH.resolve(file.src);
      
      if (typeof file.src === 'string') {
        matches = GLOB.sync(file.src);
        
        if (matches.length === 1 && matches[0] === file.src.replace(/\\/g, '/') && FS.statSync(matches[0]).isFile()) {
          normalizedFiles.push({
            src: file.src,
            dest: PATH.resolve(file.dest || PATH.join(PATH.dirname(file.src), 'out-' + PATH.basename(file.src)))
          });
        } else if (matches.length >= 1) {
          matches.forEach(function (f) {
            var stat, dest;
            
            if (FS.existsSync(f)) {
              stat = FS.statSync(f);
              
              if (stat.isFile()) {
                dest = file.dest || file.src;
                
                if (PATH.extname(dest)) {
                  dest = PATH.dirname(dest);
                }
                
                dest = PATH.resolve(PATH.join(dest, (file.dest ? '' : 'out-') + PATH.basename(f)));
                
                normalizedFiles.push({
                  src: PATH.resolve(f),
                  dest: dest
                });
              } else if (stat.isDirectory()) {
                normalizedFiles = normalizedFiles.concat(
                  exports.normalizeFiles([PATH.join(f, '*.*')])
                );
              }
            }
          });
        }
      } else {
        throw new Error('Expected file "src" to be a string. ' + file.src);
      }
    } else {
      throw new Error('Encountered unsupported file object. ' + file);
    }
  });

  return normalizedFiles;
};

processAndWriteFiles = function (files, context, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
      
  processFiles(files, context, options, function (error, files) {
    if (error) {
      callback(error);
    } else {
      ASYNC.each(files, function (file, callback) {
        MKDIRP(PATH.dirname(file.dest), function (error) {
          if (error) {
            callback(error);
          } else {
            FS.writeFile(file.dest, file.content, callback);
          }
        });
      }, function (error) {
        if (error) {
          callback(error);
        } else {
          callback(null, files);
        }
      });
    }
  });
};

processFiles = function (files, context, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  ASYNC.map(getFileExtensions(files), function (ext, callback) {
    var phases, opts;
    
    opts = extendRec({}, getFileTypeOptions(context.extensions, ext), options);
    phases = opts.pipeline.getPhases();
    
    ASYNC.mapSeries(phases, function (phase, callback) {
      ASYNC.mapSeries(files.filter(function (file) {
        return PATH.extname(file.src) === ext;
      }), function (file, callback) {
        var f;
      
      // TODO: Rethink how to use caching to optimize
      // file processing when files are referenced by other
      // files more then once. Is this really even needed?
      
        // if (context.cache.exists(file.src)) {
        //   f = context.cache.get(file.src);
        //   f.dest = f.dest || file.dest;
        //   callback(null, f);
        // } else {
          if (!file.content) {
            file.content = FS.readFileSync(file.src, 'utf8');
          }
          // context.cache.set(file.src, file);
          opts.pipeline.process(phase, file, opts, context.helpers, callback);
        // }
      }, callback);
    }, callback);
  }, function (error, files) {
    if (error) {
      callback(error);
    } else {
      callback(null, _.flatten(files));
    }
  });
};

extendRec = function () {
  var args, o;
  
  args = [].slice.call(arguments);
  o = args.shift() || {};
  
  _.each(args, function (arg) {
    if (Object(arg) === arg) {
      _.each(arg, function (v, k) {
        if (Array.isArray(v) && Array.isArray(o[k])) {
          o[k] = v;
          //o[k] = o[k].concat(v);
        } else if (Object(v) === v && Object(o[k]) === o[k]) {
          extendRec(o[k], v);
        } else {
          o[k] = v;
        }
      });
    }
  });
  
  return o;
};

getFileExtensions = function (files) {
  return _.uniq(files.map(function (file) {
    return PATH.extname(file.src);
  }));
};

getFileTypeOptions = function (extensions, ext) {
  ext = ext.replace('.', '');
  return extensions[ext] || extensions.defaults;
};