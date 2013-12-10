var 
// Modules
FS, PATH, _, PROCESSOR, UTIL, GLOB,
// Functions
normalizeFiles, processAndWriteFiles, processFiles, getFileTypeOptions;

FS = require('fs');
PATH = require('path');
_ = require('underscore');
PROCESSOR = require('./lib/processor');
UTIL = require('./lib/util');
GLOB = require('glob');

// options keys:
// extensions
// processors
exports.compile = function (files, options, callback) {
  var processorCollection, cache, context;
  
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  options.extensions = options.extensions || {};
  
  options.extensions.defaults = _.extend({
    mode: 'debug',
    directivePrefix: '#',
    directiveSuffix: '\n'
  }, options.extensions.defaults || {});
  
  options.extensions.js = _.extend({}, options.extensions.defaults, {
    directivePrefix: '// #',
    directiveSuffix: '\n'
  }, options.extensions.js || {});
  
  options.extensions.css = _.extend({}, options.extensions.defaults, {
    directivePrefix: '/* #',
    directiveSuffix: '*/'
  }, options.extensions.css || {});
  
  options.extensions.html = _.extend({}, options.extensions.defaults, {
    directivePrefix: '<!-- #',
    directiveSuffix: '-->'
  }, options.extensions.html || {});

  processorCollection = PROCESSOR.makeProcessorColleciton();
  options.processors.forEach(function (processor) {
    processorCollection.insert(processor, processor.order);
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
  
  
  files = Array.isArray(files) ? files : [];
  files = normalizeFiles(files);
  context = {
    cache: cache,
    extensions: options.extensions,
    processorCollection: processorCollection
  };
  context.helpers = PROCESSOR.generateHelpers(context, {
    processFiles: processFiles,
    processAndWriteFiles: processAndWriteFiles
  });
  
  processAndWriteFiles(files, context, callback);
};

normalizeFiles = function (files) {
  var normalizedFiles;
  
  normalizedFiles = [];
  
  files.forEach(files, function (file) {
    var dest;
    
    if (typeof file === 'string') {
      file = {src:file, dest:'.'};
    }
    
    if (Object(file) === file && file.src) {
      dest = PATH.resolve(file.dest || '.');
      
      if (typeof file.src === 'string') {
        matches = GLOB.sync(file.src);
        
        if (matches.length === 1 && matches[0] === file.src) {
          normalizedFiles.push({
            src: PATH.resolve(file.src),
            dest: dest
          });
        } else if (matches.length > 1) {
          if (PATH.extname(dest)) {
            dest = PATH.dirname(dest);
          }
          
          matches.forEach(function (f) {
            var stat;
            
            if (PATH.existsSync(f)) {
              stat = PATH.statSync(f);
              
              if (stat.isFile()) {
                normalizedFiles.push({
                  src: PATH.resolve(f),
                  dest: PATH.join(dest, PATH.basename(f));
                });
              } else if (stat.isDirectory()) {
                normalizedFiles = normalizedFiles.concat(
                  normalizeFiles([{
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

processAndWriteFiles = function (files, context, callback) {
  processFiles(files, context, function (error, files) {
    if (error) {
      callback(error);
    } else {
      files.forEach(function (file) {
        FS.writeFileSync(file.dest, file.content, 'utf8');
      });
      callback(null, files);
    }
  });
};

processFiles = function (files, context, callback) {
  UTIL.mapAsync(files, function (file, callback) {
    var options;
      
    options = getFileTypeOptions(context.extensions, PATH.extname(file.src));
    file.content = context.cache.getOrSet(file.src, function () {
      return FS.readFileSync(file.src, 'utf8');
    });
      
    UTIL.waterfallAsync(context.processorCollection.map(function (p) {
      return function (f, callback) {
        p.process(f, options, context.helpers, callback);
      };
    }), file, callback);
    
  }, callback);
};

getFileTypeOptions = function (extensions, ext) {
  ext = ext.replace('.', '');
  return extensions[ext] || extensions.defaults;
};