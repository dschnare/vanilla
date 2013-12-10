module.exports = [{
    // #include path/to/file.ext
    name: 'include',
    process: function (content, options, vanilla, _) {
      var open, close, temp, meta, prefix, suffix, lastIndex, result, , resourcePath;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      lastIndex = 0;
      
      while (true) {
        open = vanilla.readDirective('include', prefix, suffix, content, lastIndex);
        
        if (open.empty) {
          // do nothing
        } else {
          close = vanilla.readDirective('/include', prefix, suffix, content, open.end);
          
          if (!close.empty) {
            temp = vanilla.readDirective('include', prefix, suffix, content, open.end);
            
            if (temp.empty || temp.begin > close.begin) {
              /*jshint evil:true */
              meta = (new Function('return ' + content.substring(open.end, close.begin))).call();
              /*jshint evil:false */
            }
          }
          
          resourcePath = vanilla.resolvePath(open.text);
          result = vanilla.processFile(resourcePath, {meta: meta});
          content = content.substring(0, open.begin) + result + content.substring(open.end);
          lastIndex = open.begin + result.length;
        }
      }
      
      return content;
    }
  }, {
    // #meta
    // JS block
    // #/meta
    // OR
    // #meta propertyname
    // value
    // #/meta
    name: 'meta',
    process: function (content, options, vanilla, _) {
      var meta, blockDirective, lastIndex, prefix, suffix;

      meta = options.meta = options.meta || {};
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      lastIndex = 0;
      
      while (true) {
        blockDirective = vanilla.readBlockDirective('meta', prefix, suffix, content, lastIndex);
        
        if (blockDirective.open) {
          if (blockDirective.open.text) {
            meta[blockDirective.open.text] = blockDirective.body;
          } else {
            /*jshint evil:true */
            _.extend(meta, (new Function('return ' + blockDirective.body)).call());
            /*jshint evil:false */
          }
          
          content = content.substring(0, blockDirective.open.end) + content.substring(blockDirective.close.end);
          lastIndex = blockDirective.open.end;
        }
      }
      
      _.each(meta, function (v, k) {
        if (typeof v === 'function') {
          meta[k] = v.bind(meta);
        }
      });
      
      return content;
    }
  }, {
    // #reference path/to/file.ext
    name: 'reference',
    process: function (content, options, vanilla, _) {
      var directive, prefix, suffix, lastIndex, result, resourcePath, ref;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      lastIndex = 0;
      
      while (true) {
        directive = vanilla.readDirective('reference', prefix, suffix, content, lastIndex);
        
        if (directive.empty) {
          // do nothing
        } else {
          resourcePath = vanilla.resolvePath(directive.text);
          result = vanilla.processAndWriteFile(resourcePath);
          ref = options.reference(result.filePath, result.content);
          content = content.substring(0, directive.begin) + ref + content.substring(directive.end);
          lastIndex = directive.begin + ref.length;
        }
      }
      
      return content;
    }
  }, {
    name: 'block',
    process: function (content, options, vanilla, _) {
      var open, close, temp, prefix, suffix, lastIndex, blockExtensions, blockExtension, body;
      
      blockExtensions = options.blockExtensions || [];
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      lastIndex = 0;
      
      while (true) {
        open = vanilla.readDirective('block', prefix, suffix, content, lastIndex);
        
        if (open.empty) {
          break;
        } else {
          close = vanilla.readDirective('/block', prefix, suffix, content, open.end);
          
          if (close.empty) {
            break;
          } else {
            temp = vanilla.readDirective('block', prefix, suffix, content, open.end);
            
            if (temp.empty || temp.begin > close.begin) {
              body = content.substring(open.end, close.begin);
              blockExtension = _.where(blockExtensions, {blockName: open.text});
              
              if (blockExtension) {
                switch (blockExtension.type) {
                  case 'replace':
                    body = blockExtension.body;
                    break;
                  case 'append':
                    body += blockExtension.body;
                    break;
                  case 'prepend':
                    body = blockExtension.body + body;
                    break;
                }
              }
              
              content = content.substring(0, open.end) + body + content.substring(close.end);
              lastIndex = open.end + body.length;
            } else {
              break;
            }
          }
        }
      }
      
      return content;
    }
  }, {
    name: 'partial',
    process: function (content, options, vanilla, _) {
      var partials, blockDirective, lastIndex, prefix, suffix;

      partials = options.partials = options.partials || {};
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      lastIndex = 0;
      
      while (true) {
        blockDirective = vanilla.readBlockDirective('partial', prefix, suffix, content, lastIndex);
        
        if (blockDirective.open) {
          if (blockDirective.open.text) {
            partials[blockDirective.open.text] = blockDirective.body;
          } else {
            /*jshint evil:true */
            _.extend(partials, (new Function('return ' + blockDirective.body)).call());
            /*jshint evil:false */
          }
          
          content = content.substring(0, blockDirective.open.end) + content.substring(blockDirective.close.end);
          lastIndex = blockDirective.open.end;
        }
      }
      
      return content;
    }
  }, {
    name: 'replace',
    process: function (content, options, vanilla, _) {
      // TODO: Create blockExtensions on options
    }
  }, {
    name: 'append',
    process: function (content, options, vanilla, _) {
      // TODO: Create blockExtensions on options
    }
  }, {
    name: 'prepend',
    process: function (content, options, vanilla, _) {
      // TODO: Create blockExtensions on options
    }
  }, {
    name: 'extend',
    process: function (content, options, vanilla, _) {
      // TODO: Find the layout file path and process the layout,
      // passing in our blockExtensions and meta objects.
    }
  }
};