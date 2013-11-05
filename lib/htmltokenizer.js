// <v:meta> ... </v:meta>

// <v:extends file="">
// <v:block name=""> ... </v:block>
// <v:import file="">
// <v:import file=""> ... </v:import>

// <v:script name=""> ... </v:script>

exports.createTokenizer = function (stringReader) {
  return {
    next: function () {
      var attribute, directive = {
        name: '',
        closing: false,
        attriutes: [],
        start: 0,
        end: 0
      };
      
      // Encountered a vanilla directive.
      if (stringReader.consume('<v:')) {
        directive.start = stringReader.position() - 3;
        directive.name = stringReader.read(function (c) {
          return c <= ' ' || c === '>';
        });
        
        while (stringReader.peekChar() !== '>') {
          attribute = {};
          
          // Attribute name may be empty if the directive has this form:
          // <v:name >
          attribute.name = stringReader.read(function (c) {
            return c === '=' || c <= ' ' || c === '>';
          }).trim();
          
          // Malformed HTML. (name>)
          if (attribute.name && stringReader.peekChar() === '>') {
            // ERROR!
          } else if (attribute.name && c === '=') {
            // Consume the '='.
            stringReader.readChar();
            // Consume the opening quote.
            var quote = stringReader.readChar();
            
            if (quote === '"' || quote === "'") {
              attribute.value = stringReader.read(function (c) {
                return c === quote;
              });
              // Consume the closing quote.
              stringReader.readChar();
              directive.attriutes.push(attriute);
            // Malformed HTML. (name={non quote})
            } else {
              // ERROR!
            }
          }
        }
        
        directive.end = stringReader.position();
      } else if (stringReader.consume('</v:')) {
        directive.end = stringReader.position();
        directive.name = stringReader.read(function (c) {
          return c === '>';
        }).trim();
        directive.end = stringReader.position();
        directive.closing = true;
      }
      
      return directive.name;
    }
  };
};