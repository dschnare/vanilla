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
var orderReg = /(after|before|replace):(\w+)/;

module.exports = function(grunt) {
  var processAndWriteFiles, processAndWriteFile, processFile, vanilla, deepClone;
  
  grunt.registerMultiTask('vanilla', 'Simple text file templating plugin.', function() {
    var options, processors;

    options = this.options({
      baseDest: 'web',
      processors: [],
      extensions: require('../extensions'),
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
    
    processors = require('../processors');
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
    this.files.forEach(function(f) {
      var files = f.src.filter(function(filePath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filePath)) {
          grunt.log.warn('Source file "' + filePath + '" not found.');
          return false;
        } else {
          return true;
        }
      });
      
      processAndWriteFiles(files, path.resolve(options.baseDest, f.dest), options);
    });
  });

  processAndWriteFiles = function (files, dest, options) {
    files.forEach(function (filePath) {
      var opts = options[path.extname(filePath).substr(1)] || options.defaults;
      processAndWriteFile(filePath, opts, dest);
    });
  };
  
  processAndWriteFile = function (filePath, fileOptions, dest) {
    var content = processFile(filePath, fileOptions);
    
    dest = dest || fileOptions.dest;
    
    // If filePath is absolute then we just take it's name when writing.
    if (path.resolve(filePath) === filePath) {
      filePath = path.basename(filePath);
    }
      
    // Destination is a file.
    if (path.extname(dest)) {
      grunt.file.write(dest, content);
    // Destination is a directory.
    } else {
      grunt.file.write(path.join(dest, filePath), content);
    }
    
    return {content:content, filePath:path.join(dest, filePath)};
  };
  
  processFile = function (filePath, fileOptions) {
    var content, v;
    
    if (fileOptions.cache && fileOptions.cache.exists(filePath)) {
      return fileOptions.cache.get(filePath);
    }
    
    fileOptions = deepClone(fileOptions);
    content = grunt.file.read(filePath, {encoding:'utf8'});
    
    v = Object.create(vanilla);
    v.resolvePath = function (aFilePath) {
      return path.resolve(path.dirname(filePath), aFilePath);
    };
    
    _.each(processors, function (processor, directiveName) {
      content = processor.process(content, fileOptions, v, _);
    });
    
    content = Hogan.compile(content).render(fileOptions.meta || {}, fileOptions.partials || {});
    
    // TODO: Run transpilation
    
    // TODO: Run minification
    // if (fileOptions.mode === 'compress' && typeof fileOptions.minify === 'function') {
    //   fileOptions.minify(content, function (error, result) {
    //     if (error) {
          
    //     } else {
          
    //     }
    //   });
    // }
    
    fileOptions.cache.set(filePath, content);
    
    return content;
  };
  
  deepClone = function (o) {
    var obj, result;
    
    if (Array.isArray(o)) {
      result = _.map(o, function (v) {
        return deepClone(v);
      });
    } else if (Object(o) === o) {
      result = {};
      _.each(o, function (v, k) {
        result[k] = deepClone(v);
      });
    } else {
      result = o;
    }
    
    return result;
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
    processAndWriteFile: function (filePath) {
      var fileOptions = options[path.extname(filePath).substr(1)] || options.defaults;
      return processAndWriteFile(filePath, fileOptions);
    },
    processFile: function (filePath, opts) {
      var fileOptions = options[path.extname(filePath).substr(1)] || options.defaults;
      _.extend(fileOptions, opts);
      return processFile(filePath, fileOptions);
    },
    deepClone: deepClone
  };
};