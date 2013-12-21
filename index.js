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
    directiveSuffix: '\n'
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
      pipeline: PROCESSOR.defaultPipelines.hmtl(PROCESSOR.makePipeline())
    })
  };
  
  // Ensure the file extensions have pipelines and that
  // builtin pipelines use their default pipelines.
  _.each(options, function (value, key) {
    var pipeline;
    
    if (key !== 'defaults') {
      pipeline = extensionDefaults[key] ? extensionDefaults[key].pipeline : PROCESSOR.makePipeline();
      options[key] = _.extend({}, extensionDefaults[key] || options.defaults, value);
      
      if (typeof value.pipeline === 'function') {
        options[key].pipeline = value.pipeline(pipeline);
      } else if (!value.pipeline || typeof value.process !== 'function') {
        options[key].pipeline = pipeline;
      }
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
  
  processAndWriteFiles(files, context, callback);
};

exports.normalizeFiles = function (files) {
  var normalizedFiles;
  
  files = Array.isArray(files) ? files : [];
  normalizedFiles = [];
  
  files.forEach(function (file) {
    var dest, matches;
    
    if (typeof file === 'string') {
      file = {src:file, dest:'.'};
    }
    
    if (Object(file) === file && file.src) {
      dest = PATH.resolve(file.dest || '.');
      
      if (typeof file.src === 'string') {
        matches = GLOB.sync(file.src);
        
        if (matches.length === 1 && matches[0] === file.src && FS.statSync(matches[0]).isFile()) {
          normalizedFiles.push({
            src: PATH.resolve(file.src),
            dest: dest
          });
        } else if (matches.length >= 1) {
          if (PATH.extname(dest)) {
            dest = PATH.dirname(dest);
          }
          
          matches.forEach(function (f) {
            var stat;
            
            if (FS.existsSync(f)) {
              stat = FS.statSync(f);
              
              if (stat.isFile()) {
                normalizedFiles.push({
                  src: PATH.resolve(f),
                  dest: PATH.join(dest, PATH.basename(f))
                });
              } else if (stat.isDirectory()) {
                normalizedFiles = normalizedFiles.concat(
                  exports.normalizeFiles([{
                    src: PATH.join(f, '*.*'),
                    dest: dest
                  }])
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
        var opts, f;
      
        if (context.cache.exists(file.src)) {
          f = context.cache.get(file.src);
          f.dest = f.dest || file.dest;
          callback(null, f);
        } else {
          file.content = FS.readFileSync(file.src, 'utf8');
          context.cache.set(file.src, file);
          opts.pipeline.process(phase, file, opts, context.helpers, callback);
        }
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
        if (Object(v) === v && Object(o[k]) === o[k]) {
          o[k] = extendRec(o[k], v);
        } else if (Array.isArray(v) && Array.isArray(o[k])) {
          o[k] = o[k].concat(v);
        } else {
          o[k] = v;
        }
      });
    }
  });
};

getFileExtensions = function (files) {
  _.uniq(files.map(function (file) {
    return PATH.extname(file.src);
  }));
};

getFileTypeOptions = function (extensions, ext) {
  ext = ext.replace('.', '');
  return extensions[ext] || extensions.defaults;
};