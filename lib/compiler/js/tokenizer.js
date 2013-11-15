// //#import "file[.js]"
// //#debug
// //#end

exports.createTokenizer = function (stringReader) {
  var handlers = {};
  
  return {
    next: function () {
      var attribute, directive = {
        name: '',
        value: '',
        start: 0,
        end: 0
      };
      
      // Encountered a vanilla directive.
      if (stringReader.consume('//#')) {
        directive.start = stringReader.position() - 3;
        directive.name = stringReader.read(function (c) {
          return c <= ' ';
        }).trim();
        
        if (directive.name) {
          if (stringReader.peekChar() !== '\n') {
            directive.value = stringReader.read(function (c) {
              return c === '\n';
            }).trim();
            
            if (directive.value) {
              try {
                directive.value = JSON.parse(directive.value);
              } catch (error) {
                throw new Error('Expected valid JSON: ' + directive.value);
              }
            }
          }
          
          directive.end = stringReader.position();
        } else {
          directive.start = 0;
        }
      }
      
      return directive;
    }
  };
};