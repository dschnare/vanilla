exports.generateHelpers = require('./helpers').generateHelpers;

exports.makeProcessorCollection = function () {
  var collection = [];
  
  collection.insert = function (processor, orderExpression) {
    var i, pair;
    
    if (!processor) {
      return;
    }
    
    if (this.length) {
      pair = orderExpression.split(':');
      if (pair.length === 2) {
        i = -1;
        this.some(function (p, k) {
          if (p.name === pair[1]) {
            i = k;
            return true;
          }
        });
        
        if (i >= 0) {
          switch (pair[0]) {
            case 'after':
              this.splice(i + 1, 0, processor);
              break;
            case 'before':
              this.splice(i, 0, processor);
              break;
            case 'replace':
              this[i] = processor;
              break;
          }
        } else {
          this.push(processor);
        }
      }
    } else {
      this.push(processor);
    }
  };
  
  return collection;
};