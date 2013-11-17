// @@import "file[.js]"

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
      if (stringReader.consume('@@')) {
        directive.start = stringReader.position() - 2;
        directive.name = stringReader.read(function (c) {
          return c <= ' ';
        }).trim();
        
        if (directive.name) {
          if (stringReader.peekChar() !== '\n') {
            stringReader.read('"\'\n');
            
            if (stringReader.peekChar() !== '\n') {
              stringReader.readChar();
              directive.value = stringReader.read('"\'');
              stringReader.readChar();
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