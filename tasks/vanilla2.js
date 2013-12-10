/*
 * vanilla
 * https://github.com/dschnare/vanilla
 *
 * Copyright (c) 2013 Darren Schnare
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var fs = require('fs');
var Hogan = require('beefcake.js');
var _ = require('underscore');
var orderReg = /(after|before|replace)\s*:\s*(\w+)/;
var util = require('../lib/util');

module.exports = function(grunt) {
  var processAndWriteFiles, processAndWriteFile, processFile, vanilla;
  
  grunt.registerMultiTask('vanilla', 'Simple text file templating plugin.', function() {
    var options, processors, done;
    
    done = this.async();

    options = this.options({
      baseDest: 'web',
      processors: [],
      extensions: require('../lib/extensions'),
      defaults: {
        mode: 'debug',
        mustacheDeliiter: '{{ }}',
        directivePrefix: '#',
        directiveSuffix: '\n',
        reference: function (resourcePath, resourceContent) {
          return resourceContent;
        }
      }
    });

    options.defaults.cache = {
      hash: {},
      exists: function (key) {
        return !!this.hash[key];
      },
      get: function (key) {
        return this.hash[key];
      },
      set: function (key, value) {
        this.hash[key] = value;
      },
      clear: function () {
        this.hash = {};
      }
    };

    options.baseDest = path.resolve(options.baseDest);
    
    _.each(options.extensions, function (opts, key, extensions) {
      opts.dest = path.resolve(options.baseDest, opts.dest || key);
      extensions[key] = _.extend({}, options.defaults, opts);
    });
    
    processors = require('../lib/processors');
    options.processors.forEach(function (processor) {
      var match, insertionPoint;
      
      if (processor.name && typeof processor.name === 'string') {
        if (processor.order && typeof processor.order === 'string' && !!(match = processor.oder.match(orderReg))) {
          processors.some(function (p, i) {
            if (p.name === match[2]) {
              insertionPoint = i;
              return true;
            }
          });
          if (insertionPoint >= 0) {
            switch (match[1]) {
              case 'after':
                processors.splice(insertionPoint + 1, 0, processor);
                break;
              case 'before':
                processors.splice(insertionPoint, 0, processor);
                break;
              case 'replace':
                processors[insertionPoint] = processor;
                break;
            }
          }
        } else {
          processors.push(processor);
        }
      }
    });
    
    // Iterate over all specified file groups.
    util.forEachAsync(this.files, function (fileObject, i, origFiles, callback) {
      var files = fileObject.src.filter(function(filePath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filePath)) {
          grunt.log.warn('Source file "' + filePath + '" not found.');
          return false;
        } else {
          return true;
        }
      });
      
      processAndWriteFiles(files, path.resolve(options.baseDest, fileObject.dest), options, callback);
    }, function (error) {
      done(!!error);
    });
  });

  processAndWriteFiles = function (files, dest, options, callback) {
    files = files.slice();
    
    util.forEachAsync(files, function (filePath, callback) {
      var opts, absFilePath;
      
      opts = options[path.extname(filePath).substr(1)] || options.defaults;
      opts = Object.create(opts);
      absFilePath = path.resolve(filePath);
      
      // Destination is a file
      if (path.extname(dest)) {
        opts.dest = dest;
      // Destination is a directory
      } else {
        if (absFilePath === filePath) {
          opts.dest = path.join(dest, path.basename(filePath));
        } else {
          // Preserve the relative filePath when writing.
          opts.dest = path.join(dest, filePath);
        }
      }
      
      processAndWriteFile(absFilePath, opts, callback);
    }, callback);
  };
  
  processAndWriteFile = function (filePath, fileOptions, callback) {
    // TODO: this function should set the destination.
    
    processFile(filePath, fileOptions, function (error, result) {
      var dest = fileOptions.dest;
      
      if (error) {
        callback(error);
      } else {
        // Only do a write if the filePath hasn't been written before.
        if (!result.dest) {
          dest = util.replaceExtname(dest, result.extname);
          result.dest = dest;
          fileOptions.cache.set(filePath, result);
          grunt.file.write(dest, content);
        }

        callback(null, {content:result.content, filePath:dest});
      }
    });
  };
  
  processFile = function (filePath, fileOptions, callback) {
    var v, delim, operations;
    
    // TODO: Create context and use that to pass to all processors.
    
    if (fileOptions.cache.exists(filePath)) {
      callback(null, fileOptions.cache.get(filePath));
      return;
    }
    
    fileOptions = util.deepClone(fileOptions);
    v = Object.create(vanilla);
    v.resolvePath = function (aFilePath) {
      return path.resolve(path.dirname(filePath), aFilePath);
    };
    
    // context = _.extend({}, fileOptions, {
    //   filePath: filePath,
    //   content: grunt.file.read(filePath, {encoding:'utf8'}),
    //   dest: ''
    // });
    
    // Processing
    operations = processors.map(function (p) {
      return function (content, callback) {
        p.process(content, fileOptions, v, _, callback);
      }
    };
    operations.push.apply(operations, [
      // Interpolation
      function (content, callback) {
        var delim = '';
        
        if (fileOptions.mustacheDeliiter && fileOptions.mustacheDeliiter !== '{{ }}') {
          delim = '{{=' + fileOptions.mustacheDeliiter + '=}}';
        }
        
        content = Hogan.compile(delim + content).render(fileOptions.meta || {}, fileOptions.partials || {});
        callback(null, content);
      },
      // Transpilation
      function (content, callback) {
        if (typeof fileOptions.transpile === 'function') {
          fileOptions.transpile(content, callback);
        } else {
          callback(null, {content:content, extname:path.extname(filePath)});
        }
      },
      // Minification
      function (result, callback) {
        if (fileOptions.mode === 'compress' && typeof fileOptions.minify === 'function') {
          fileOptions.minify(result.content, function (error, content) {
            if (error) {
              callback(error);
            } else {
              result.content = content;
              callback(null, result);
            }
          });
        } else {
          callback(null, result);
        }
      }
    ]);
    
    // Run all operations asynchronously
    util.waterfallAsync(operations, grunt.file.read(filePath, {encoding:'utf8'}), function (error, result) {
      if (error) {
        callback(error);
      } else {
        fileOptions.cache.set(filePath, result);
        callback(null, result);
      }
    });
  };
  
  
  // API exposed to processors.
  vanilla = {
    readDirective: function (directiveName, prefix, suffix, content, fromIndex) {
      var dir, j, k, directive = {empty:true};
      
      suffix = suffix || '\n';
      formIndex = fromIndex || 0;
      dir = prefix + directiveName;
      j = content.indexOf(dir, fromIndex);
      
      if (j >= 0) {
        k = content.indexOf(suffix, j);
        if (k > j) {
          directive.begin = j;
          directive.end = k + suffix.length;
          directive.text = content.substring(j + dir.length, k).trim();
          directive.empty = false;
        }
      }
      
      return directive;
    },
    readBlockDirective: function (directiveName, prefix, suffix, content, fromIndex) {
      var open, close, result;
      
      result = {};
      fromIndex = fromIndex || 0;
      open = this.readDirective(directiveName, prefix, suffix, content, fromIndex);
              
      if (open.empty) {
        // do nothing
      } else {
        close = this.readDirective('/' + directiveName, prefix, suffix, content, open.end);
        if (close.empty) {
          throw new Error('Malformed block directive encountered: ' + directiveName);
        } else {
          result = {open:open, close:close, body: content.substring(open.end, close.begin).trim()};
        }
      }
      
      return result;
    },
    processAndWriteFile: function (filePath, opts, callback) {
      var fileOptions, dest;
      
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      
      fileOptions = options[path.extname(filePath).substr(1)] || options.defaults;
      dest = path.join(fileOptions.dest, 'reference-' + Date.now() + '--' + path.basename(filePath));
      _.extend(fileOptions, opts);
      
      return processAndWriteFile(filePath, fileOptions, dest, callback);
    },
    processFile: function (filePath, opts, callback) {
      var fileOptions;
      
      if (typeof opts === 'function') {
        callback = opts;
        opts = {};
      }
      
      fileOptions = options[path.extname(filePath).substr(1)] || options.defaults;
      _.extend(fileOptions, opts);
      
      return processFile(filePath, fileOptions, callback);
    },
    deepClone: util.deepClone
  };
};