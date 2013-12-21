var _, ASYNC;

_ = require('underscore');
ASYNC = require('async');

exports.generateHelpers = require('./helpers').generateHelpers;
exports.defaultPipelines = require('./defaults');

exports.makePipeline = function () {
  var collection, busy;
  
  busy = false;
  collection = [];
  
  return {
    // add(processor)
    // add(processor, where, targetProcessorName)
    add: function (processor, where, targetProcessorName) {
      if (processor && 
          typeof processor.process === 'function' && 
          typeof processor.name === 'string') {
        
        processor.phase = processor.phase || 'default';
        
        if (typeof where === 'string' && typeof targetProcessorName === 'string') {
          switch (where) {
            case 'before':
              collection.some(function (p, i) {
                if (p.name === targetProcessorName) {
                  collection.splice(i, 0, processor);
                  return true;
                }
              });
              break;
            case 'after':
              var i = collection.length;
              while (i >= 0) {
                if (collection[i].name === targetProcessorName) {
                  collection.splice(i + 1, 0, processor);
                  break;
                }
              }
              break;
            case 'replace':
              collection.some(function (p, i) {
                if (p.name === targetProcessorName) {
                  collection[i] = processor;
                  return true;
                }
              });
              break;
          }
        } else {
          collection.push(processor);
        }
      }
    },
    getPhases: function () {
      return _.pluck(collection, 'phase');
    },
    // process(file, options, helpers, callback)
    // process(phase, file, options, helpers, callback)
    process: function (phase, file, options, helpers, callback) {
      var processors, self;
      
      if (arguments.length === 4) {
        callback = helpers;
        helpers = options;
        options = file;
        file = phase;
        phase = 'default';
      }
      
      busy = true;
      self = this;
      phase = phase + '';
      
      processors = _.where(collection, {phase: phase}).map(function (p) {
        return function (file, callback) {
          p.process(file, options, helpers, callback);
        };
      });
      processors.unshift(function (callback) {
        callback(null, file);
      });
      
      ASYNC.waterfall(processors, function (error, file) {
        busy = false;
        callback(error, file);
      });
    },
    clear: function () {
      if (busy) {
        return;
      }
      while (collection.length) {
        collection.pop();
      }
    }
  };
};