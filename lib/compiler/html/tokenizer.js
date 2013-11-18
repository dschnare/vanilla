// <v:script src="file.js" />
// <v:stylesheet src="file.css" />

// <v:include file="">
// <v:include file=""> ... JSON (pased to file) ... </v:include> (future?)

// <v:extends file="">
// <v:block name="" [operation=""]> ... HTML ... </v:block>

// Used when template is interpolated.
// <v:data> ... JSON ... </v:data>

exports.createTokenizer = function (stringReader) {
  return {
    next: function () {
      var attribute, directive = {
        name: '',
        closing: false,
        selfClosing: false,
        attributes: {},
        start: 0,
        end: 0
      };
      
      while (!stringReader.end()) {
        stringReader.read('<');
        
        // Open directive.
        if (stringReader.peek(3) === '<v:') {
          directive.start = stringReader.position();
          stringReader.consume('<v:');
          directive.name = stringReader.read(function (c) {
            return c <= ' ' || c === '/' || c === '>';
          });
          
          while (stringReader.peekChar() !== '/' && stringReader.peekChar() !== '>' && stringReader.peekChar()) {
            attribute = {};
            
            // Skip over whitespace.
            stringReader.read(function (c) { return c > ' '; });
            
            // Attribute name may be empty if the directive has this form:
            // <v:name >
            attribute.name = stringReader.read(function (c) {
              return c === '=' || c <= ' ' || c === '/' || c === '>';
            });
            
            if (attribute.name) {
              switch (stringReader.peekChar()) {
                case '/':
                case '>':
                  // Malformed HTML. (<v:node name>)
                  break;
                case '=':
                  // Consume the '='.
                  stringReader.readChar();
                  // Consume the opening quote.
                  var quote = stringReader.readChar();
                  
                  if (quote === '"' || quote === "'") {
                    attribute.value = stringReader.read(quote);
                    // Consume the closing quote.
                    stringReader.readChar();
                    
                    directive.attributes[attribute.name] = attribute.value;
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
          
          stringReader.read(function (c) { return c === '/' || c === '>'; });
          if (stringReader.peekChar() === '/') {
            stringReader.readChar();
            directive.closing = directive.selfClosing = true;
          }
          
          if (stringReader.peekChar() === '>') {
            stringReader.readChar();
            directive.end = stringReader.position();
          // Malformed HTML. (<v:node / >)
          } else {
            // ERROR!
          }
          
          return directive;
        
        // Closing directive.
        } else if (stringReader.peek(4) === '</v:') {
          directive.start = stringReader.position();
          stringReader.consume('</v:');
          directive.name = stringReader.read('>').trim();
          stringReader.readChar();
          directive.end = stringReader.position();
          directive.closing = true;
          
          return directive;
        } else {
          stringReader.readChar();
        }
      }
      
      return directive;
    }
  };
};