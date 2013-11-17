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


Options
----------

{
  server: {
    root: 'relative path to server root (relative to options JSON file or the current directory)'
  },
  js: {
    output: 'path to copy/output javascript files (relative to server root)',
    minify: function (script, done) [optional -- default uses uglifyjs-2]
  },
  css: {
    output: 'path to copy/output stylesheet files (relative to server root)'
  },
  html: {
    output: 'path to copy/output html files (relative to server root)'
  }
}



Roadmap
----------

1) Add Hogan + Beefcake support to HTML templates.
2) Look into adding glob support for the first argument to compile().
3) Look at only reading a chunk from disk at a time into a buffer. This will
   give the tool a more predictable memory footprint.

