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
    root: 'relative/absolute path to server root (relative to options JSON file or the current directory)'
  },
  js: {
    output: 'path to copy/output javascript files (relative to server root)',
    minify: function (script, done) [optional -- default uses yui]
  },
  css: {
    output: 'path to copy/output stylesheet files (relative to server root)',
    minify: function (stylesheet, done) [optional -- default uses yui]
  },
  html: {
    output: 'path to copy/output html files (relative to server root)'
  }
}



Roadmap
----------

1) (COMPLETE) Add CSS support.
2) (COMPLETE) Add Hogan + Beefcake support to HTML templates.
3) Look into adding glob support for the first argument to compile().
4) Add ability to pass a JSON object to an HTML file that is being included with <v:include>.
5) Refactor each compiler so that only one tokenizer is created, also instead of modifying
   the source text, produce a new text so that the token markers are still valid.
6) Look at only reading a chunk from disk at a time into a buffer. This will
   give the tool a more predictable memory footprint.

