var _, LIB;

_ = require('underscore');
LIB = require('./lib');

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
  
  return pipeline;
};

exports.html = function (pipeline) {
  // Add processors from the builtin processor library.
  
  pipeline.add(LIB.meta('meta'));
  
  pipeline.add(LIB.include());
  pipeline.add(LIB.partial());
  pipeline.add(LIB.block());
  pipeline.add(LIB.replace());
  pipeline.add(LIB.append());
  pipeline.add(LIB.prepend());
  pipeline.add(LIB.extend());
  
  return pipeline;
};