// Calls compile() recursively and replaces the element appropriately.
// <v:script src="file.js" />
// <v:link rel="stylesheet" href="file.css" />

// <v:include file="">
// <v:include file=""> ... JSON ... </v:include>

// <v:extends file="">
// <v:block name=""> ... HTML ... </v:block>

// Used when template is interpolated.
// <v:meta> ... JSON (or can be JavaScript -- even async?) ... </v:meta>

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
      
      // Opening directive.
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
          
          if (attriute.name) {
            switch (stringReader.peekChar()) {
              case '>':
                // Malformed HTML. (<v:node name>)
                break;
              case '=':
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
                  directive.end = stringReader.position();
                // Malformed HTML. (<v:node name={non quote}>)
                } else {
                  // ERROR!
                }
                break;
              default:
                // Malformed HTML. (<v:node name =...>)
            }
          }
        }
      // Closing directive.
      } else if (stringReader.consume('</v:')) {
        directive.start = stringReader.position() - 4;
        directive.name = stringReader.read(function (c) {
          return c === '>';
        }).trim();
        directive.end = stringReader.position();
        directive.closing = true;
      }
      
      return directive;
    }
  };
};