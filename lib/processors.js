module.exports = {
  'meta': {
    // #meta
    // JS block
    // #/meta
    // OR
    // #meta summary
    // value
    // #/meta
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
  },
  'reference': {
    // #reference path/to/file.ext
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
    }
  },
  'include': {
    // #include path/to/file.ext
    process: function (content, options, vanilla, _) {
      var directive, prefix, suffix, lastIndex, result, resourcePath;
      
      prefix = options.directivePrefix;
      suffix = options.directiveSuffix;
      lastIndex = 0;
      
      while (true) {
        directive = vanilla.readDirective('include', prefix, suffix, content, lastIndex);
        
        if (directive.empty) {
          // do nothing
        } else {
          // NOTE: What about passing meta data to the included file?
          resourcePath = vanilla.resolvePath(directive.text);
          result = vanilla.processFile(resourcePath);
          content = content.substring(0, directive.begin) + result + content.substring(directive.end);
          lastIndex = directive.begin + result.length;
        }
      }
    }
  },
  'block': {
    process: function (content, options, vanilla, _) {
      
    }
  },
  'partial': {
    process: function (content, options, vanilla, _) {
      
    }
  },
  'extend': {
    process: function (content, options, vanilla, _) {
      
    }
  },
  'replace': {
    process: function (content, options, vanilla, _) {
      
    }
  },
  'append': {
    process: function (content, options, vanilla, _) {
      
    }
  },
  'prepend': {
    process: function (content, options, vanilla, _) {
      
    }
  }
};