var PATH, TMP, FS;

PATH = require('path');
TMP = require('tmp');
FS = require('fs');

exports.generateHelpers = function (context, vanilla) {
  return {
    resolvePath: function (parentFilePath, relChildFilePath) {
      return PATH.resolve(PATH.dirname(parentFilePath), relChildFilePath);
    },
    processFile: function (filePath, parentFile, options, callback) {
      var files;

      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      if (FS.existsSync(PATH.join(PATH.dirname(parentFile.dest), PATH.basename(filePath)))) {
        TMP.tmpName({
          dir: PATH.dirname(parentFile.dest),
          prefix: PATH.basename(filePath, PATH.extname(filePath)) + '-',
          postfix: PATH.extname(filePath)
        }, function (error, dest) {
          var files, opt;

          if (error) {
            callback(error);
          } else {
            files = [{
              src: filePath,
              dest: dest
            }];

            vanilla.processFiles(files, context, options, function (error, files) {
              if (error) {
                callback(error);
              } else {
                callback(null, files[0]);
              }
            });
          }
        });
      } else {
        files = [{
          src: filePath,
          dest: PATH.join(PATH.dirname(parentFile.dest), PATH.basename(filePath))
        }];
        
        vanilla.processFiles(files, context, options, function (error, files) {
          if (error) {
            callback(error);
          } else {
            callback(null, files[0]);
          }
        });
      }
    },
    // processAndWriteFile: function (filePath, dest, options, callback) {
    //   var files = [{
    //     src: filePath,
    //     dest: dest
    //   }];
      
    //   if (typeof options === 'function') {
    //     callback = options;
    //     options = {};
    //   }
      
    //   vanilla.processAndWriteFiles(files, context, options, function (error, files) {
    //     if (error) {
    //       callback(error);
    //     } else {
    //       callback(null, files[0]);
    //     }
    //   });
    // },
    // readDirective(directiveName, prefix, suffix, content)
    // readDirective(directiveName, prefix, suffix, content, fromIndex)
    readDirective: function (directiveName, prefix, suffix, content, fromIndex) {
      var dir, j, k, directive = {empty:true};
      
      suffix = suffix || '\n';
      fromIndex = fromIndex || 0;
      dir = prefix + directiveName;
      j = content.indexOf(dir, fromIndex);
      
      if (j >= 0) {
        k = content.indexOf(suffix, j);
        
        if (k > j) {
          directive.begin = j;
          directive.end = k + suffix.length;
          directive.text = content.substring(j + dir.length, k).replace(/\/$/, '').trim().replace(/^['"]|['"]$/g, '');
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
      open = this.readDirective(directiveName, prefix, suffix, content, fromIndex);
              
      if (open.empty) {
        result.open = open;
      } else {
        close = this.readDirective('/' + directiveName, prefix, suffix, content, open.end);
        result.open = open;
        result.close = close;
        
        if (!close.empty) {
          temp = this.readDirective(directiveName, prefix, suffix, content, open.end);
          
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