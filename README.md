vanilla
==========

A simple HTML, JS and CSS templating library.

Install
----------

    npm install git://github.com/dschnare/vanilla.git


Usage
----------

    require('vanilla').compile('*.html', {
      projectRoot: './src',
      webRoot: './web'
    }, function (error) {
      if (error) throw error;
    });
    

Learn
----------

** JavaScript **

* * *

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


* Cycles *

Cyclic imports are detected and are prevented.


* Debugging *

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
    
    


** CSS **

* * *

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


* Cycles *

Cyclic imports are detected and are prevented.


* Debugging *

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



** HTML **

* * *

    <v:data> ... JSON ... </v:data>

Specifies a block of JSON data to use as the context when parsing the HTML template with [Hogan.js](http://twitter.github.io/hogan.js/)+[Beefcake.js](https://github.com/dschnare/beefcake.js).
    
    <v:script src="file.js" />
    <v:stylesheet src="file.css" />

Directive to include JavaScript and CSS directly into the HTML template. These directives will run the included script and stylesheets through the vanilla compiler and insert the appropriate HTML elements to include the compiled results.

    <v:include file="" />
    <v:include file=""> ... JSON (pased to included file) ... </v:include>

Directive to include another HTML template into this one with or without a specific JSON data context for the included HTML template. 

    <v:extends file="" />
    <v:block name="" [operation=""]> ... HTML ... </v:block>

These directives are used for specifying layouts and layout blocks. Layout blocks in a layout can be replaced, appended to or prepended to from an extending HTML template. In addition all blocks are exposed as partials to [Hogan.js](http://twitter.github.io/hogan.js/)+[Beefcake.js](https://github.com/dschnare/beefcake.js).

Supported block operations are the following:

- replace (default) - replace the layout block of the same name
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

    compile(filepath)
    compile(filepath, mode)
    compile(filepath, options)
    compile(filepath, callback)
    compile(filepath, mode, callback)
    compile(filepath, options, callback)
    compile(filepath, mode, options, callback)
    
Will compile JavaScript, CSS or HTML files. Where `filepath` is relative to the `projectRoot`.

Examples:

    compile('some.js', 'compress', { ... options ... }, callback)
    compile('some.js', 'concat', { ... options ... }, callback)
    compile('some.js', 'debug', { ... options ... }, callback)
    
    compile('some.css', 'compress', 'pathto.options.js', callback)
    compile('*.css', 'concat', 'pathto.options.js', callback)
    compile('*.css', 'debug', 'pathto.options.js', callback)
    
    compile('*.html', 'compress', { ... options ... }, callback)
    compile('*.html', 'concat', { ... options ... }, callback)
    compile('*.html', 'debug', { ... options ... }, callback)


** Modes **

The following modes are supported and have the following affect on JavaScript and CSS compilation:

* debug *

When compiling JavaScript files in `debug` mode no concatenation or compilation actually occurs. The callback has the following signature: `function (error, filename, markup)`

Where `filename` is normally the file that was written to the `webRoot` will be set to the empty string and instead the `markup` argument will have the HTML markup needed to include the source scripts into an HTML document. This same behaviour occurs when compiling CSS files in `debug` mode.

Example:

    require('vanilla').compile('js/main.js', 'debug', {
      projectRoot: './src',
      webRoot: './web'
    }, function (error, filename, markup) {
      // filename is the empty string
      // markup is HTML markup to include the scripts/styleshets from the projectRoot
    });

* compress *

Concatenates and minifies then writes to the `webRoot`. Keeps the same base path relative to the `projectRoo` when writing to `webRoot`.

When compiling JavaScript files in `compress` mode all import directives are crawled and the dependencies are concatenated then minified and finally saved to the `webRoot` with an extension `.min.js`. When saving the minified script the base path portion that is relative to the `projectRoot` is created in the `webRoot`.

The callback has the following signature: `function (error, filename)`

Where `filename` is the file that was written to the `webRoot`. This same behaviour occurs when compiling CSS files in `compress` mode only their extension will be `.min.css`.

Example:

    require('vanilla').compile('js/main.js', 'compress', {
      projectRoot: './src',
      webRoot: './web'
    }, function (error, filename) {
      // filename is the written script/stylesheet to the webRoot
    });

* concat (default) *

Concatenates then writes to the `webRoot`. Keeps the same base path relative to the `projectRoot` when writing to `webRoot`.

When compiling JavaScript files in `concat` mode all import directives are crawled and the dependencies are concatenated then saved to the `webRoot` with an extension `.max.js`. When saving the concatenated script the base path portion that is relative to the `projectRoot` is created in the `webRoot`.

The callback has the following signature: `function (error, filename)`

Where `filename` is the file that was written to the `webRoot`. This same behaviour occurs when compiling CSS files in `compress` mode only their extension will be `.max.css`.

Example:

    require('vanilla').compile('js/main.js', 'concat', {
      projectRoot: './src',
      webRoot: './web'
    }, function (error, filename) {
      // filename is the written script/stylesheet to the webRoot
    });


** Options **

    {
      projectRoot 'relative/absolute path to project root [default ./src]
          (relative to options JSON file or the current directory)'
      webRoot: 'relative/absolute path to web root where all files will be written to [default ./web]
          (relative to options JSON file or the current directory)',
      js: {
        minify: function (script, done) [optional -- default uses yui]
      },
      css: {
        minify: function (stylesheet, done) [optional -- default uses yui]
      },
      html: {
        context: { object that servers as the mustache context (must be an Object) }, [optional]
        partials: { object containing mustache partials }, [optional]
        including: true/false - indicates that this HTML file is being included
          so don't write to disk, [optional]
        blocks: { hash of all blocks to have inserted into this HTML layout -- 
          these are objects with a 'body' and an 'operation' property } [optional]
          (i.e. { body: 'Hello', operation: 'append' })
      }
    }



Roadmap
----------

1. (COMPLETE) Add CSS support.
2. (COMPLETE) Add Hogan + Beefcake support to HTML templates.
3. (COMPLETE) Look into adding glob support for the first argument to compile().
4. (COMPLETE) Add ability to pass a JSON object to an HTML file that is being included with <v:include>.
5. (COMPLETE) Add support for shorthand block replacement via the <v:append name="">, <v:prepend name=""> and <v:replace name=""> elements similar to Jade syntax.
6. Better error reporting.
7. Refactor each compiler so that only one tokenizer is created, also instead of modifying
   the source text, produce a new text so that the token markers are still valid.
8. Look at only reading a chunk from disk at a time into a buffer. This will
   give the tool a more predictable memory footprint.
