var _, LIB, YUI, PATH, FS, MKDIRP;

_ = require('underscore');
LIB = require('./lib');
YUI = require('yuicompressor');
PATH = require('path');
FS = require('fs');
MKDIRP = require('mkdirp');

exports.defaults = function (pipeline) {
  pipeline.add(LIB.data());
  pipeline.add(LIB.include());
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extends());
  pipeline.add(LIB.interpolation());

  return pipeline;
};

exports.js = function (pipeline) {
  // Add processors from the builtin processor library.
  
  pipeline.add(LIB.data());
  pipeline.add(LIB.include({moduleEntryPoint: 'index.js'}));
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extends());
  pipeline.add(LIB.interpolation());
  pipeline.add({
    name: 'minify',
    process: function (file, options, helpers, callback) {
      var extname;
      
      extname = PATH.extname(file.dest);
      
      // Only minify if mode is 'compress'.
      if (options.mode === 'compress') {
        YUI.compress(file.content, {
          charset: 'utf8',
          type: 'js'
        }, function (error, result) {
          if (error) {
            callback(error);
          } else {
            file.minified = true;
            file.content = result;
            file.dest =  PATH.join(PATH.dirname(file.dest), PATH.basename(file.dest, extname) + '.min.' + extname);
            callback(null, file);
          }
        });
      } else {
        callback(null, file);
      }
    }
  });

  return pipeline;
};

exports.css = function (pipeline) {
  // Add processors from the builtin processor library.
  
  pipeline.add(LIB.data());
  pipeline.add(LIB.include());
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extends());
  pipeline.add(LIB.interpolation());
  pipeline.add({
    name: 'minify',
    process: function (file, options, helpers, callback) {
      var extname;
      
      extname = PATH.extname(file.dest);
      
      // Only minify if mode is 'compress'.
      if (options.mode === 'compress') {
        YUI.compress(file.content, {
          charset: 'utf8',
          type: 'css'
        }, function (error, result) {
          if (error) {
            callback(error);
          } else {
            file.minified = true;
            file.content = result;
            
            if (file.dest) {
              file.dest = PATH.join(PATH.dirname(file.dest), PATH.basename(file.dest, extname) + '.min.' + extname);  
            }
            
            callback(null, file);
          }
        });
      } else {
        callback(null, file);
      }
    }
  });
  
  return pipeline;
};

exports.html = function (pipeline) {
  // Add processors from the builtin processor library.
  
  pipeline.add(LIB.data('data'));

  // Handling including .js and .css files specially when processing HTML files.
  pipeline.add(LIB.include(function (file, includedFile, helpers, callback) {
    switch (PATH.extname(includedFile.src)) {
      case '.js':
        if (FS.existsSync(includedFile.dest)) {
          callback(null, '<script src="' + PATH.relative(file.src, includedFile.dest).replace(/\\/g, '/') + '"></script>');
        } else {
          MKDIRP.sync(PATH.dirname(includedFile.dest));
          FS.writeFileSync(includedFile.dest, includedFile.content);
          callback(null, '<script src="' + PATH.relative(file.src, includedFile.dest).replace(/\\/g, '/') + '"></script>');
        }
        break;
      case '.css':
        if (includedFile.dest) {
          callback(null, '<link rel="stylesheet" href="' + PATH.relative(file.src, includedFile.dest).replace(/\\/g, '/') + '" />');
        } else {
          MKDIRP.sync(PATH.dirname(includedFile.dest));
          FS.writeFileSync(includedFile.dest, includedFile.content);
          callback(null, '<link rel="stylesheet" href="' + PATH.relative(file.src, includedFile.dest).replace(/\\/g, '/') + '" />');
        }
        break;
      default:
        callback(null, includedFile.content);
    }
  }));
  
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extends());
  pipeline.add(LIB.interpolation());
  
  return pipeline;
};