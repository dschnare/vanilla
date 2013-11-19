vanilla
==========

A simple HTML, JS and CSS templating library.

Install
----------

    npm install git://github.com/dschnare/vanilla.git


Usage
----------

    require('vanilla').compile('./src/*.html', {
      projectRoot: './web/src', // our source folder is in web/ so we can debug CSS and JS
      serverRoot: './web'
    }, function (error) {
      if (error) throw error;
    });
    

Learn
----------

**JavaScript**

    //#import "file[.js]"

Imports a JavaScript file where the file path is relative to the file performing the import.
When a script is imported it can be written in two ways a) as a typcial global browser script or
b) a module. A module script assigns properties to `exports`. If the imported script is a module then
it will be wrapped in a scope that has `exports` bound to an object. That object will then be
bound to a global variable with the same name as the basename of the imported file.

For example:

a.js

    //#import "./b.js"
    var a = 'A';

b.js

    //#import "./c.js"
    exports.B = 'B';
  
c.js

    var c = 'C';
  
result

    var c = 'C';
    
    //#import "./c.js"
    var b = (function (exports) { exports.B = 'B'; return exports; }({}));
    
    //#import "./b.js"
    var a = 'A';


*Cycles*

Cyclic imports are detected and are prevented.


*Debugging*

During `debug` mode scripts cannot be wrapped, but instead are referenced in `<script>` elements
where their `src` attribute points to the original source script. These elements are included
in such a way so that `exports` is still bound to an object and will be available to other scripts.

For example:

a.js

    //#import "./b.js"
    var a = 'A';

b.js

    //#import "./c.js"
    exports.B = 'B';
  
c.js

    var c = 'C';
  

result

    <script src="/srcdir/c.js" type="text/javascript"></script>
    <script type="text/javascript">var exports = {};</script>
    <script src="/srcdir/b.js" type="text/javascript"></script>
    <script type="text/javascript">var b = exports;</script>
    <script src="/srcdir/a.js" type="text/javascript"></script>
    
    


**CSS**

/* @@import "file[.js]" */

Imports a CSS file where the file path is relative to the file performing the import.

For example:

a.css

    /* @@import "./b.css" */
    p { color: red; }

b.js

    /* @@import "./c.css" */
    p { color: blue; }
  
c.js

    p { color: green; }
  
result

    p { color: green; }
    
    /* @@import "./c.css" */
    p { color: blue; }
    
    /* @@import "./b.css" */
    p { color: red; }


*Cycles*

Cyclic imports are detected and are prevented.


*Debugging*

Stylesheets are referenced in `<link>` elements where their `href` attribute points to the original source stylesheet.

For example:

a.css

    /* @@import "./b.css" */
    p { color: red; }

b.js

    /* @@import "./c.css" */
    p { color: blue; }
  
c.js

    p { color: green; }
  
result

    <link rel="stylesheet" href="/srcdir/c.css" />
    <link rel="stylesheet" href="/srcdir/b.css" />
    <link rel="stylesheet" href="/srcdir/a.css" />



**HTML**

    <v:data> ... JSON ... </v:data>

Specifies a block of JSON data to use as the context when parsing the HTML template with Hogan.js+Beefcake.js.
    
    <v:script src="file.js" />
    <v:stylesheet src="file.css" />

Directive to include JavaScript and CSS directly into the HTML template. These directives will run the included script and stylesheets through the vanilla compiler and insert the appropriate HTML elements to include the compiled results.

    <v:include file="" />
    <v:include file=""> ... JSON (pased to included file) ... </v:include>

Directive to include another HTML template into this one with or without a specific JSON data context for the included HTML template. 

    <v:extends file="" />
    <v:block name="" [operation=""]> ... HTML ... </v:block>

These directives are used for specifying layouts and layout blocks. Layout blocks in a layout can be replaced, appended to or prepended to from an extending HTML template. In addition all blocks are exposed as partials to Hogan.js+Beefcake.js.

Supported block operations are the following:

- replace (default) = replace the layout block of the same name
- prepend - prepend to the layout block of the same name
- append - append to the layout block of the same name


Examples:

a.html

    <v:data>{"title":"Hello"}</v:data>
    <v:extends file="./layout.html" />
    <v:block name="body">
      <p>This is the body</p>
    </v:block>
    <v:block name="footer" operation="prepend">
      <div class="copyright">This is the footer copyright</div>
    </v:block>


main.js

    var Main = {};

layout.html

    <html>
      <head>
        <title>{{title}} World!</title>
      </head>
      <body>
        <div class="wrapper">
          <div class="body"><v:block name="body" /></div>
          <footer>
            <v:block name="footer">
              <ul class="legal-links">
                <li><a href="TBD">Terms</a></li>
                <li><a href="TBD">Privacy</a></li>
              </ul>
            </v:block>
          </footer>
        </div>
        <v:script src="./main.js" />
      </body>
    </html>


result (compiled in compress mode)

    <html>
        <head>
          <title>Hello World!</title>
        </head>
        <body>
          <div class="wrapper">
            <div class="body">
              <p>This is the body</p>
            </div>
            <footer>
                <div class="copyright">This is the footer copyright</div>
                <ul class="legal-links">
                  <li><a href="TBD">Terms</a></li>
                  <li><a href="TBD">Privacy</a></li>
                </ul>
            </footer>
          </div>
          <script src="/js/main.min.js" type="text/javascript"></script>
        </body>
      </html>


API
----------

    compile(filepath, mode, options, callback)
    compile(filepath, mode, path_to_options_js_file, callback)
    
Will compile JavaScript, CSS or HTML files.

Examples:

    compile('some.js', 'compress', 'vanilla-options.js')
    compile('some.css', 'compress', 'vanilla-options.js')
    compile('some.html', 'debug', 'vanilla-options.js')


**Options**

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

1. (COMPLETE) Add CSS support.
2. (COMPLETE) Add Hogan + Beefcake support to HTML templates.
3. (COMPLETE) Look into adding glob support for the first argument to compile().
4. (COMPLETE) Add ability to pass a JSON object to an HTML file that is being included with <v:include>.
5. Refactor each compiler so that only one tokenizer is created, also instead of modifying
   the source text, produce a new text so that the token markers are still valid.
6. Look at only reading a chunk from disk at a time into a buffer. This will
   give the tool a more predictable memory footprint.

