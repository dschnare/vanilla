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
var processors = require('../lib/processors');

module.exports = function(grunt) {
  var processAndWriteFiles, processAndWriteFile, processFile, vanilla, deepClone;
  
  grunt.registerMultiTask('vanilla', 'Simple text file templating plugin.', function() {
    var options;

    options = this.options({
      baseDest: 'web',
      defaults: {
        mode: 'debug',
        mustacheDeliiter: '{{ }}',
        directivePrefix: '#',
        directiveSuffix: '\n',
        reference: function (resourcePath, resourceContent) {
          return resourceContent;
        }
      },
      html: {
        dest: './',
        directivePrefix: '<:v',
        directiveSuffix: '>',
        reference: function (resourcePath, resourceContent) {
          switch (path.extname(resourcePath)) {
            case '.js':
              return '<script type="text/javascript" src="{src}"></script>'.replace('{src}', resourcePath);
              break;
            case '.json':
              resourceContent = 'window["' + path.basename(resourcePath, '.json') + '"] = ' + resourceContent + ';';
              return '<script type="text/javascript">{script}</script>'.replace('{script}', resourceContent);
              break;
            case '.css':
              return '<link rel="stylesheet" href="{href}" />'.replace('{href}', resourcePath);
              break;
            default:
              return resourceContent;
          }
        }
      },
      js: {
        directivePrefix: '// #',
        minify: function (content, callback) {
          require('yuicompressor').compress(content, {
            charset: 'utf8',
            type: 'js'
          }, callback);
        }
      },
      css: {
        directivePrefix: '/* #',
        directiveSuffix: '*/',
        minify: function (content, callback) {
          require('yuicompressor').compress(content, {
            charset: 'utf8',
            type: 'css'
          }, callback);
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
    
    _.each(options, function (opts, key) {
      if (['defaults', 'baseDest', 'processors'].indexOf(key) < 0) {
        opts.dest = path.resolve(options.baseDest, opts.dest || key);
        options[key] = _.extend({}, options.defaults, opts);
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
    
    _.each(fileOptions.processors, function (processor, directiveName) {
      content = processor.process(content, fileOptions, v, _);
    });
    
    // TODO: Run Hogan.js here.
    
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
      // TODO: Need to have filePath converted to absolute path.
      var fileOptions = options[path.extname(filePath).substr(1)] || options.defaults;
      return processAndWriteFile(filePath, fileOptions);
    },
    processFile: function (filePath) {
      // TODO: Need to have filePath converted to absolute path.
      var fileOptions = options[path.extname(filePath).substr(1)] || options.defaults;
      return processFile(filePath, fileOptions);
    },
    deepClone: deepClone
  };
  
  
  
  
  
  
  
  
  // ------------

  parseHtmlFile = function (content, filePath, options, blockExtensions, meta, partials) {
    var result, blocks;
    
    result = parseMeta(content);
    content = result.content;
    meta = mixin(result.meta, meta || {});
    
    result = parseIncludes(content, filePath, options);
    content = result.content;
    
    result = parseScriptsAndStylesheets(content, filePath, options);
    content = result.content;
    
    blocks = getBlocks(content);
    
    if (Array.isArray(blockExtensions)) {
      blockExtensions.forEach(function (extension, i) {
        var block;
        
        if (!extension) {
          return;
        }
        
        block = blocks[extension.blockName];
        
        if (block) {
          switch (extension.type) {
            case 'append':
              block.content = block.content + extension.content;
              break;
            case 'prepend':
              block.content = extension.content + block.content;
              break;
            default:
              block.content = extension.content;
          }
          
          blockExtensions[i] = undefined;
        }
      });
    }
    
    Object.keys(blocks).reverse().forEach(function (blockName) {
      var block = blocks[blockName];
      content = content.substring(0, block.begin) + block.content + content.substring(block.end);
    });
    
    result = parsePartials(content);
    content = result.content;
    partials = mixin(result.partials, partials || {});
    
    result = parseLayout(content, filePath, options, blockExtensions, meta, partials);
    content = result.content;
    
    return {content:content, meta:meta, partials:partials};
  };

  parseMeta = function (content) {
    // Parse directives of the form:
    // <v:meta>JavaScript literal</v:meta>
    // <v:meta-somename>Multiline text</v:meta-somename>
    var meta, reg, match, o, k;
    
    meta = {};
    
    /*jshint evil:true */
    reg = /<v:meta>([^<]+)<\/v:meta>/g;
    while (match = reg.exec(content)) {
      try {
        o = new Function('return ' + match[1].trim()).call();
      } catch (o) {
        continue;
      }
      
      for (k in o) {
        meta[k] = o[k];
      }
    }
    content = content.replace(/(?:\r\n|\n)?\s*<v:meta>[^<]*<\/v:meta>\s*/g, '');
    /*jshint evil:false */
    
    reg = /<v:meta name=("|')([^\1]+?)\1\s*>([\s\S]*?)<\/v:meta>/g;
    while (match = reg.exec(content)) {
      meta[match[2]] = match[3].trim();
    }
    content = content.replace(/(?:\r\n|\n)?\s*<v:meta name=("|')[^\1]+?\1\s*>[\s\S]*?<\/v:meta>\s*/g, '');
    
    return {meta:meta, content:content};
  };

  parseIncludes = function (content, includingFilepath, options) {
    // Recursively parse each included HTML file. Look for
    // directives of the form:
    // <v:include file="" />
    var reg, match, dirname, includedFilepath, includes, result, includeMeta, interpolatedContent;
    
    includes = [];
    dirname = path.resolve(path.dirname(includingFilepath));
    
    reg = /<v:include (?:file|src)=("|')([^\1]+?)\1\s*(?:\/>|>([^<]*?)<\/v:include>|>)/g;
    while (match = reg.exec(content)) {
      includedFilepath = path.resolve(dirname, match[2]);
      
      if (match[3]) {
        includeMeta = (new Function('return ' + match[3].trim()).call());
      }

      // Only read from cache if there were no meta variables specified
      if (!match[3] && options.cache.exists(includedFilepath)) {
        interpolatedContent = options.cache.get(includedFilepath);
      } else if (path.extname(includedFilepath) === '.html') {
        result = parseHtmlFile(grunt.file.read(includedFilepath), includedFilepath, options, null, includeMeta);
        interpolatedContent = Hogan.render(result.content, result.meta, result.partials);
      } else {
        interpolatedContent = Hogan.render(grunt.file.read(includedFilepath), includeMeta || {});
      }

      // Only cache the interpolated result if there was no meta variables specified.
      if (!match[3]) {
        options.cache.set(includedFilepath, interpolatedContent);
      }

      includes.push({
        content: interpolatedContent,
        begin: match.index,
        end: reg.lastIndex
      });
    }
    
    includes.reverse().forEach(function (incl) {
      content = content.substring(0, incl.begin) + incl.content + content.substring(incl.end);
    });
    
    return {content:content};
  };
  
  parseScriptsAndStylesheets = function (content, includedFilepath, options) {
    // Concatenate and possibly minify scripts and stylesheets. Look for
    // directives of the form:
    // <v:script file="" />
    // <v:stylesheet file="" />
    var reg, match, dirname, resources, concatenatedDeps;
    
    resources = [];
    dirname = path.resolve(path.dirname(includedFilepath));
    
    reg = /<v:(stylesheet|script) (?:file|src)=("|')([^\2]+?)\2\s*\/?>/g;
    while (match = reg.exec(content)) {
      resources.push({
        type: match[1],
        filePath: path.resolve(dirname, match[3]),
        relFilePath: match[3],
        begin: match.index,
        end: reg.lastIndex,
        dest: match[6] ? match[6] : ''
      });
    }
    
    resources.reverse().forEach(function (resource) {
      var deps;
      
      switch (resource.type) {
        // Interpret: /* @@import "file.css" */
        case 'stylesheet':
          if (options.cache.exists(resource.filePath)) {
            concatenatedDeps = options.cache.get(resource.filePath);
          } else {
            deps = crawlDependencies(/\/\*\s*@@import ("|')([^\1]+?)\1\s*\*\//g, resource.filePath, resource.relFilePath, '.css');
            concatenatedDeps = concatDependencies(deps, options, '<link rel="stylesheet" href="{url}" />');
            options.cache.set(resource.filePath, concatenatedDeps);
          }
          content = content.substring(0, resource.begin) + concatenatedDeps + content.substring(resource.end);
          break;
        // Interpret: // #import "file.js"
        case 'script':
          if (options.cache.exists(resource.filePath)) {
            concatenatedDeps = options.cache.get(resource.filePath);
          } else {
            deps = crawlDependencies(/\/\/\s*#import ("|')([^\1]+?)\1/g, resource.filePath, resource.relFilePath, '.js');
            concatenatedDeps = concatDependencies(deps, options, '<script type="text/javascript" src="{url}"></script>');
            options.cache.set(resource.filePath, concatenatedDeps);
          }
          content = content.substring(0, resource.begin) + concatenatedDeps + content.substring(resource.end);
          break;
      }
    });
    
    return {content:content};
  };
  crawlDependencies = function (pattern, filePath, relFilePath, ext, visited) {
    var deps, content, match, importedFilename, baseDir;

    deps = [];
    
    if (!Array.isArray(visited)) {
      visited = [];
    }

    filePath = (function (filePath) {
      var fileExt = path.extname(filePath);

      if (!fileExt && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index' + ext);
        relFilePath = path.join(relFilePath, 'index' + ext);
      } else if (fileExt !== ext) {
        filePath = path.join(path.dirname(filePath), path.basename(filePath, importedFileExt) + ext);
        relFilePath = path.join(path.dirname(relFilePath), path.basename(relFilePath, importedFileExt) + ext);
      }

      return filePath;
    }(filePath));
    
    if (visited.indexOf(filePath) >= 0) return deps;
    
    visited.push(filePath);
    
    ////// Perform the crawl //////

    baseDir = path.dirname(filePath);
    content = grunt.file.read(filePath);
    pattern = pattern.toString().split('/');
    pattern.pop();
    pattern.shift();
    pattern = new RegExp(pattern.join('/'), 'g');

    while (match = pattern.exec(content)) {
      importedFilename = path.resolve(baseDir, match[2]);
      deps = crawlDependencies(pattern, importedFilename, path.join(path.dirname(relFilePath), match[2]), ext, visited).concat(deps);
    }

    deps.push({
      filePath: filePath,
      relFilePath: relFilePath,
      content: content
    });

    return deps;
  };
  concatDependencies = function (deps, options, tpl) {
    var outputPath, urls, rootDep;

    if (!deps.length) {
      return '';
    }

    urls = [];
    rootDep = deps[deps.length - 1];

    switch (options.jsMode) {
      case 'concat':
        outputPath = prefixPathExt(path.join(options.jsDest, rootDep.relFilePath), '.max');
        grunt.file.write(outputPath, deps.map(function (dep) {
          return dep.content;
        }).join('\n\n'));
        urls.push('/' + path.relative(options.baseDest, outputPath).replace(/\\/g, '/'));
        break;
      case 'compress':
        outputPath = prefixPathExt(path.join(options.jsDest, rootDep.relFilePath), '.min');
        grunt.file.write(outputPath, options.jsMinify(deps.map(function (dep) {
          return dep.content;
        }).join('\n\n')));
        urls.push('/' + path.relative(options.baseDest, outputPath).replace(/\\/g, '/'));
        break;
      default:
        deps.forEach(function (dep) {
          var copyPath = path.join(options.jsDest, dep.relFilePath);
          grunt.file.copy(dep.filePath, copyPath, {encoding:'utf8'});
          urls.push('/' + path.relative(options.baseDest, copyPath).replace(/\\/g, '/'));
        });
    }
    
    return urls.map(function (url) {
      return tpl.replace('{url}', url);
    }).join('\n');
  };
  prefixPathExt = function (thePath, extPrefix) {
    var ext = path.extname(thePath);
    extPrefix = extPrefix || '';
    return path.join(path.dirname(thePath), path.basename(thePath, ext) + extPrefix + ext);
  };

  getBlocks = function (content) {
    var blocks, reg, match;
    
    blocks = {};
    
    reg = /<v:block name=("|')([^\1]+?)\1\s*(?:\/>|>([\s\S]*?)<\/v:block>|>)/g;
    while (match = reg.exec(content)) {
      blocks[match[2]] = {
        begin: match.index,
        end: reg.lastIndex,
        content: (match[3] || '').trim()
      };
    }
    
    return blocks;
  };

  parsePartials = function (content) {
    var partials, reg, match;
    
    partials = {};
    
    reg = /<v:partial name=("|')([^\1]+?)\1\s*(?:\/>|>([\s\S]*?)<\/v:partial>|>)/g;
    while (match = reg.exec(content)) {
      partials[match[2]] = (match[3] || '').trim();
    }

    content = content.replace(/<v:partial name=("|')[^\1]+?\1\s*(?:\/>|>[\s\S]*?<\/v:partial>|>)/g, '');
    
    return {content:content, partials:partials};
  };

  parseLayout = function (content, filePath, options, blockExtensions, meta, partials) {
    // <v:extend file="" />
    var reg, match, k, extensions, layoutFilePath;
    
    if (!Array.isArray(blockExtensions)) {
      blockExtensions = [];
    }
    
    // Only process the first extends directive if one exists.
    reg = /<v:(?:extends|layout) (?:file|src)=("|')([^\1]+?)\1\s*\/?>/;
    if (match = reg.exec(content)) {
      layoutFilePath = path.resolve(path.resolve(path.dirname(filePath)), match[2]);
      extensions = blockExtensions.concat(getBlockExtensions(content));
      content = parseHtmlFile(grunt.file.read(layoutFilePath), layoutFilePath, options, extensions, meta, partials).content;
    }
    
    return {content:content};
  };

  getBlockExtensions = function (content) {
    // <v:append name="" />
    // <v:prepend name="" />
    // <v:replace name="" />
    var extensions, reg, match;
    
    extensions = [];
    
    reg = /<v:(append|prepend|replace) name=("|')([^\2]+?)\2\s*(?:\/>|>([\s\S]*?)<\/v:\1>|>)/g;
    while (match = reg.exec(content)) {
      extensions.push({
        blockName: match[3],
        type:match[1], 
        content:(match[4] || '').trim()
      });
    }
    
    return extensions;
  };
};