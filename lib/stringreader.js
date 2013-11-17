var fs = require('fs');

exports.createStringReader = function (str) {
  var i = 0;
  
  return {
    reset: function () {
      i = 0;
    },
    position: function () {
      return i;
    },
    end: function () {
      return i >= str.length;
    },
    string: function () {
      return str;
    },
    readChar: function () {
      if (i < str.length) {
        return str.charAt(i++);
      }
      return '';
    },
    peekChar: function () {
      return this.peek();
    },
    peek: function (count) {
      count = count || 1;
      return str.substr(i, count);
    },
    // TODO: Rename to: readUntil
    // read(char)
    // read(untilFn)
    read: function (until) {
      var c, s = '';
      
      if (typeof until === 'string') {
        until = (function (chars) {
          return function (c) {
            return chars.indexOf(c) >= 0;
          };
        }(until));
      }
      
      until = typeof until === 'function' ? until : function () { return false; };
      
      c = this.peekChar();
      while (c && !until(c)) {
        s += this.readChar();
        c = this.peekChar();
      }
      
      return s;
    },
    consume: function (chars) {
      var k = i;
      
      if (!chars || i >= str.length) {
        return false;
      }
      
      while (i < str.length && str.substr(i, chars.length) !== chars) {
        i += 1;
      }
      
      if (str.substr(i, chars.length) === chars) {
        i += chars.length;
        return true;
      }
      
      i = k;
      
      return false;
    }
  };
};