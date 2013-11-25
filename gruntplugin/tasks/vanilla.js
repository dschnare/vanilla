/*
 * vanilla
 * https://github.com/dschnare/vanilla
 *
 * Copyright (c) 2013 Darren Schnare
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

module.exports = function(grunt) {
  var parseHtmlFiles, parseHtmlFile, parseMeta, 
    parseIncludes, parseScriptsAndStylesheets,
    crawlDependencies, concatScriptDependencies,
    concatStylesheetDependencies, getResourceOutputPath,
    getBlocks, parseLayout, getBlockExtensions;
  
  parseHtmlFiles = function (files, dest, otions) {
    files.forEach(function (filePath) {
      var content = grunt.file.read(filePath, {encoding:'utf8'});
      content = parseHtmlFile(content, filePath, null, otions);
      
      // NOTE: When Hoganjs and Beefcake are added to the mix we'll want to parse
      // all HTML files before we actually save them. This will give us a chance
      // to enumerate all files and their meta then provide this data to Hoganjs+Beefcake.
      
      // Destination is a file.
      if (path.extname(dest)) {
        grunt.file.write(dest, content);
      // Destination is a directory.
      } else {
        grunt.file.write(path.join(dest, filePath), content);
      }
    });
  };

  parseHtmlFile = function (content, filePath, blockExtensions, otions) {
    var meta, result, blocks;
    
    result = parseMeta(content);
    content = result.content;
    meta = result.meta;
    
    result = parseIncludes(content, filePath);
    content = result.content;
    
    // TODO: Parse <v:stylesheet> and <v:script> elements.
    // result = parseScriptsAndStylesheets(content, fileaPath, options);
    // content = result.content;
    
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
    
    result = parseLayout(content, filePath, blockExtensions);
    content = result.content;
    
    return content;
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
    
    reg = /<v:meta-(\w+)>([\s\S]*?)<\/v:meta-\1>/g;
    while (match = reg.exec(content)) {
      meta[match[1]] = match[2].trim();
    }
    content = content.replace(/<v:meta-(\w+)>[\s\S]*?<\/v:meta-\1>\s*/g, '');
    
    return {meta:meta, content:content};
  };

  parseIncludes = function (content, includingFilepath) {
    // Recursively parse each included HTML file. Look for
    // directives of the form:
    // <v:include file="" />
    var reg, match, dirname, includedFilepath, includes;
    
    includes = [];
    dirname = path.resolve(path.dirname(includingFilepath));
    
    reg = /<v:include (?:file|src)=("|')([^\1]+?)\1\s*\/>\s*/g;
    while (match = reg.exec(content)) {
      includedFilepath = path.resolve(dirname, match[2]);
      includes.push({
        content: parseHtmlFile(grunt.file.read(includedFilepath), includedFilepath).content,
        begin: match.index,
        end: reg.lastIndex
      });
    }
    
    includes.reverse().forEach(function (incl) {
      content = content.substring(0, incl.begin) + incl.content + content.substring(incl.end);
    });
    
    return {content:content};
  };
  
  parseScriptsAndStylesheets = function (content, includedFilepath, otions) {
    // Concatenate and possibly minify scripts and stylesheets. Look for
    // directives of the form:
    // <v:script file="" />
    // <v:stylesheet file="" />
    var reg, match, dirname, resources;
    
    resources = [];
    dirname = path.resolve(path.dirname(includingFilepath));
    
    reg = /<v:(stylesheet|script) (?:file|src)=("|')([^\2]+?)\2\s*(dest=("|')([^\5]+?)\5)?\/>\s*/g;
    while (match = reg.exec(content)) {
      resources.push({
        type: match[1],
        filePath: path.resolve(dirname, match[3]),
        begin: match.index,
        end: reg.lastIndex,
        dest: match[6] ? match[6] : ''
      });
    }
    
    resources.reverse().forEach(function (resource) {
      var content, deps, mode, outputPath;
      
      content = grunt.file.read(resource.filePath);
      
      switch (resource.type) {
        // Interpret: /* @@import "file.css" */
        case 'stylesheet':
          deps = crawlDependencies(/\/\*\s*@@import ("|')[^\1]+?\1\s*\*\//g, content, resouce.filePath);
          mode = options.jsMode;
          outputPath = getResourceOutputPath(resource.filePath, mode, '.css', options.cssDest, resource.dest);
          content = content.substring(0, resource.being) +  concatStylesheetDependencies(outputPath, deps, mode, otions) + content.substring(resource.end);
          break;
        // Interpret: // #import "file.js"
        case 'script':
          deps = crawlDependencies(/\/\/\s*#import ("|')[^\1]+?\1/g, content, resouce.filePath);
          mode = options.cssMode;
          outputPath = getResourceOutputPath(resource.filePath, mode, '.js', options.jsDest, resource.dest);
          content = content.substring(0, resource.being) +  concatScriptDependencies(outputPath, deps, mode, otions) + content.substring(resource.end);
          break;
      }
    });
    
    return {content:content};
  };
  getResourceOutputPath = function (resourcePath, mode, ext, dest, destPostfix) {
    var basename = path.basename(resourcePath, path.extname(resourcePath));
    
    if (mode === 'concat') {
      basename += '.max' + ext;
    } else if (mode === 'compress') {
      basename += '.min' + ext;
    }
    
    return path.join(dest, destPostfix || '', basename);
  };
  crawlDependencies = function (pattern, content, baseFilePath, deps, visited) {
    if (!Array.isArray(deps)) {
      deps = [];
    }
    
    if (!Array.isArray(visited)) {
      visited = [];
    }
    
    if (visited.indexOf(baseFilePath) >= 0) return deps;
    
    visited.push(baseFilePath);
    
    // TODO: Implement this.
    
    /*
    Returns object of the form:
    {
      filePath: 'absolute file path',
      content: ''
    }
    */
  };
  concatScriptDependencies = function (outputPath, deps, mode, options) {
    switch (mode) {
      case 'concat':
        grunt.file.write(outputPath, deps.map(function (dep) {
          return dep.content;
        }).join('\n\n'));
        break;
      case 'compress':
        grunt.file.write(outputPath, options.jsMinify(deps.map(function (dep) {
          return dep.content;
        }).join('\n\n')));
        break;
      default:
        return deps.map(function (dep) {
          var path = path.join(path.dirname(outputPath), path.basename(dep.filepath));
          grunt.file.copy(dep.filePath, path);
          return '<script src="' + path.replace(/\\/g, '/') + '"></script>';
        }).join('\n');
    }
    
    return outputFilePath;
  };
  concatStylesheetDependencies = function (outputPath, deps, mode, options) {
    switch (mode) {
      case 'concat':
        grunt.file.write(outputPath, deps.map(grunt.file.read).join('\n\n'));
        break;
      case 'compress':
        grunt.file.write(outputPath, options.cssMinify(deps.map(grunt.file.read).join('\n\n')));
        break;
      default:
        return deps.map(function (dep) {
          var path = path.join(path.dirname(outputPath), path.basename(dep.filepath));
          grunt.file.copy(dep.filePath, path);
          return '<link rel="stylesheet" href="' + path.replace(/\\/g, '/') + '" />';
        }).join('\n');
    }
    
    return outputFilePath;
  };

  getBlocks = function (content) {
    var blocks, reg, match;
    
    blocks = {};
    
    reg = /<v:block name=("|')([^\1]+?)\1\s*(?:\/>|>([\s\S]*?)<\/v:block>)/g;
    while (match = reg.exec(content)) {
      blocks[match[2]] = {
        begin: match.index,
        end: reg.lastIndex,
        content: (match[3] || '').trim()
      };
    }
    
    return blocks;
  };

  parseLayout = function (content, filePath, blockExtensions) {
    // <v:extend file="" />
    var reg, match, k, extensions, layoutFilePath;
    
    if (!Array.isArray(blockExtensions)) {
      blockExtensions = [];
    }
    
    // Only process the first extends directive if one exists.
    reg = /<v:(?:extends|layout) (?:file|src)=("|')([^\1]+?)\1\s*\/>/;
    if (match = reg.exec(content)) {
      layoutFilePath = path.resolve(path.resolve(path.dirname(filePath)), match[2]);
      extensions = blockExtensions.concat(getBlockExtensions(content));
      content = parseHtmlFile(grunt.file.read(layoutFilePath), layoutFilePath, extensions);
    }
    
    return {content:content};
  };

  getBlockExtensions = function (content) {
    // <v:append name="" />
    // <v:prepend name="" />
    // <v:replace name="" />
    var extensions, reg, match;
    
    extensions = [];
    
    reg = /<v:(append|prepend|replace) name=("|')([^\2]+?)\2\s*(?:\/>|>([\s\S]*?)<\/v:\1>)/g;
    while (match = reg.exec(content)) {
      extensions.push({
        blockName: match[3],
        type:match[1], 
        content:(match[4] || '').trim()
      });
    }
    
    return extensions;
  };



  grunt.registerMultiTask('vanilla', 'Simple HTML templating plugin that will also crawl JS and CSS dependencies.', function() {
    var options = this.options({
      baseDest: 'web',
      jsDest: 'js',
      jsMinify: function (content, callback) {
        require('yuicompressor').compress(content, {
          charset: 'utf8',
          type: 'js'
        }, callback);
      },
      cssDest: 'css',
      cssMinify: function (content, callback) {
        require('yuicompressor').compress(content, {
          charset: 'utf8',
          type: 'css'
        }, callback);
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
      
      parseHtmlFiles(files.filter(function (filePath) {
        return path.extname(filePath) === '.html';
      }), path.resolve(options.baseDest, f.dest), options);
    });
  });
};