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
      return str.charAt(i);
    },
    read: function (until) {
      var c, s = '';
      
      until = typeof until === 'function' ? until : function () { return false; };
      
      c = this.peekChar();
      while (c && !until(c)) {
        s += this.readChar();
        c = this.peekChar();
      } 
      
      return s;
    },
    consume: function (chars) {
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
      
      return false;
    }
  };
};