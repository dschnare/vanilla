vanilla
=======

A simple HTML, JS and CSS templating library.


Planning
==========

APIs
----------

// Will compile JavaScript, CSS or HTML files.
compile(filepath, options)
compile(filepath, path_to_options_js_file)

Example:
compile('some.js', 'vanilla-options.js') // Compile a single JavaScript file.
compile('some.css', 'vanilla-options.js') // Compile a single StyleSheet file.
compile('some.html', 'vanilla-options.js') // Compile a single HTML file.

NOTE: HTML files can trigger JS and CSS files to be compiled 
via <v:script> and <v:link rel="stylesheet"> elements respectively.


Options
----------

{
  server: {
    root: 'relative path to server root (relative to options JSON file or the current directory)'
  },
  js: {
    output: 'path to copy/output javascript files',
    compiler: {
      ... any custom compiler options ...
      compile: function (text, compiler_options, done) {
        // Where done is a typical Node-style callback:
        // done(error)
        // done(null, result)
        
        // Example: Some other JavaScript compilation?
      }
    }
  },
  css: {
    output: 'path to copy/output stylesheet files',
    compiler: {
      ... any custom compiler options ...
      compile: function (text, compiler_options, done) {
        // Where done is a typical Node-style callback:
        // done(error)
        // done(null, result)
        
        // Example: LESS of Sass compilation?
      }  
    }
  },
  html: {
    output: 'path to copy/output html files',
    compiler: {
      ... any custom compiler options ...
      compile: function (text, compiler_options, done) {
        // Where done is a typical Node-style callback:
        // done(error)
        // done(null, result)
        
        // Example: Hoganjs compilation/interpolation?
      }
    }
  }
}