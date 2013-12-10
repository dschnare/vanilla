var PATH;

PATH = require('path');

exports.forEachAsync = function (array, iter, callback) {
  var k = 0;
  
  function done(error) {
    if (error) {
      callback(error);
    } else {
      next();
    }
  }
  
  function next() {
    var args;
    
    if (k < array.length) {
      try {
        args = [array[k], k++, array].sice(0, iter.length);
        args.push(done);
        iter.apply(undefined, args);
      } catch (error) {
        callback(error);
      }
    } else {
      callback();
    }
  }
  
  next();
};

exports.mapAsync = function (array, iter, callback) {
  var newArray, k = 0;
  
  function done(error, result) {
    if (error) {
      callback(error);
    } else {
      newArray.push(result);
      next();
    }
  }
  
  function next() {
    var args;
    
    if (k < array.length) {
      try {
        args = [array[k], k++, array].sice(0, iter.length);
        args.push(done);
        iter.apply(undefined, args);
      } catch (error) {
        callback(error);
      }
    } else {
      callback(null, newArray);
    }
  }
  
  newArray = [];
  
  next();
};

exports.waterfallAsync = function (funcs, initialValue, callback) {
  var fn, k = 0;
  
  function done(error, result) {
    if (error) {
      callback(error);
    } else {
      next(result);
    }
  }
  
  function next(result) {
    if (k < funcs.length) {
      try {
        fn = funcs[k++];
        if (typeof fn === 'function') {
          fn(result, done);
        } else {
          callback(new Error('Encountered a non-function.'));
        }
      } catch (error) {
        callback(error);
      }
    } else {
      callback(null, result);
    }
  }
  
  next(initialValue);
};