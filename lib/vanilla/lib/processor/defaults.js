var _, LIB, YUI;

_ = require('underscore');
LIB = require('./lib');
YUI = require('yuicompressor');

exports.js = function (pipeline) {
  // Add processors from the builtin processor library.
  
  pipeline.add(LIB.meta());
  // pipeline.add(LIB.depend()); // i.e. import
  pipeline.add(LIB.include());
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extend());
  pipeline.add({
    name: 'minify',
    process: function (file, options, helpers, callback) {
      if (options.mode === 'compress') {
        YUI.compress(file.content, {
          charset: 'utf8',
          type: 'js'
        }, function (error, result) {
          if (error) {
            callback(error);
          } else {
            file.content = result;
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
  
  pipeline.add(LIB.meta());
  // pipeline.add(LIB.depend()); // i.e. import
  pipeline.add(LIB.include());
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extend());
  pipeline.add({
    name: 'minify',
    process: function (file, options, helpers, callback) {
      if (options.mode === 'compress') {
        YUI.compress(file.content, {
          charset: 'utf8',
          type: 'css'
        }, function (error, result) {
          if (error) {
            callback(error);
          } else {
            file.content = result;
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
  
  pipeline.add(LIB.meta('meta'));
  
  // TODO: Add reference support (i.e. reference a JS or CSS file)
  
  pipeline.add(LIB.include());
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extend());
  
  return pipeline;
};