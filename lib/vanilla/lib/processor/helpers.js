var PATH;

PATH = require('path');

exports.generateHelpers = function (context, vanilla) {
  return {
    resolvePath: function (parentFilePath, relChildFilePath) {
      return PATH.resolve(PATH.dirname(parentFilePath), relChildFilePath);
    },
    processFile: function (filePath, callback) {
      var files = [{
        src: filePath,
        dest: ''
      }];
      
      vanilla.processFiles(files, context, function (error, files) {
        if (error) {
          callback(error);
        } else {
          callback(null, files[0].content);
        }
      });
    },
    processAndWriteFile: function (filePath, dest, callback) {
      var files = [{
        src: filePath,
        dest: dest
      }];
      
      vanilla.processAndWriteFiles(files, context, function (error, files) {
        if (error) {
          callback(error);
        } else {
          callback(null, files[0].dest);
        }
      });
    },
    // readDirective(directiveName, prefix, suffix, content)
    // readDirective(directiveName, prefix, suffix, content, fromIndex)
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
    // readBlockDirective(directiveName, prefix, suffix, content)
    // readBlockDirective(directiveName, prefix, suffix, content, fromIndex)
    readBlockDirective: function (directiveName, prefix, suffix, content, fromIndex) {
      var open, close, temp, result;
      
      result = {
        open: {empty:true},
        close: {empty:true},
        body: ''
      };
      
      fromIndex = fromIndex || 0;
      open = exports.readDirective(directiveName, prefix, suffix, content, fromIndex);
              
      if (open.empty) {
        result.open = open;
      } else {
        close = exports.readDirective('/' + directiveName, prefix, suffix, content, open.end);
        result.close = close;
        
        if (!close.empty) {
          temp = exports.readDirective(directiveName, prefix, suffix, content, open.end);
          
          if (!temp.empty && temp.begin < close.begin) {
            throw new Error('Nested block directive encountered: ' + directiveName);
          } else {
            result.body = content.substring(open.end, close.begin).trim();  
          }
        }
      }
      
      return result;
    }
  };
};