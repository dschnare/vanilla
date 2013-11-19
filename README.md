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
  serverRoot 'relative/absolute path to server root (relative to options JSON file or the current directory)'
  webRoot: 'relative/absolute path to web root (relative to options JSON file or the current directory)',
  js: {
    minify: function (script, done) [optional -- default uses yui]
  },
  css: {
    minify: function (stylesheet, done) [optional -- default uses yui]
  },
  html: {
    context: { object that servers as the mustache context }, [optional]
    partials: { object containing mustache partials }, [optional]
    including: true/false - indicates that this HTML file is being included so don't write to disk, [optional]
    blocks: { hash of all blocks to have inserted into this HTML layout -- these are objects with a 'body' and an 'operation' property } [optional]
      (i.e. { body: 'Hello', operation: 'append' })
  }
}



Roadmap
----------

1) (COMPLETE) Add CSS support.
2) (COMPLETE) Add Hogan + Beefcake support to HTML templates.
3) (COMPLETE) Look into adding glob support for the first argument to compile().
4) (COMPLETE) Add ability to pass a JSON object to an HTML file that is being included with <v:include>.
5) Refactor each compiler so that only one tokenizer is created, also instead of modifying
   the source text, produce a new text so that the token markers are still valid.
6) Look at only reading a chunk from disk at a time into a buffer. This will
   give the tool a more predictable memory footprint.

