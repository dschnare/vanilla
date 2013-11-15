vanilla
=======

A simple HTML, JS and CSS templating library.


Planning
==========

APIs
----------

// Will compile JavaScript, CSS or HTML files.
compile(filepath, mode, options)
compile(filepath, mode, path_to_options_js_file)

Example:
compile('some.js', 'compress', 'vanilla-options.js') // Compile a single JavaScript file.
compile('some.css', 'compress', 'vanilla-options.js') // Compile a single StyleSheet file.
compile('some.html', 'debug', 'vanilla-options.js') // Compile a single HTML file.

NOTE: Perhaps add glob support.

NOTE: HTML files can trigger JS and CSS files to be compiled
via <v:script> and <v:link rel="stylesheet"> elements respectively.


Options
----------

{
  server: {
    root: 'relative path to server root (relative to options JSON file or the current directory)'
  },
  js: {
    output: 'path to copy/output javascript files (relative to server root)',
    minify: function (script, done)
  },
  css: {
    output: 'path to copy/output stylesheet files (relative to server root)'
  },
  html: {
    output: 'path to copy/output html files (relative to server root)'
  }
}