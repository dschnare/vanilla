# vanilla

> Simple HTML templating plugin that crawls JS and CSS dependencies.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install vanilla --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('vanilla');
```

## The "vanilla" task

### Overview
In your project's Gruntfile, add a section named `vanilla` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  vanilla: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.baseDest
Type: `String`
Default value: `'web'`

A path to the base directory for all outputs. This directory is also used
as the base for all URLs.

#### options.mode
Type: `String`
Default value: `'debug'`

A string value indicating what mode to compile JavaScript and Stylesheet resources in.
This value will override `jsMode` and `cssMode` if they don't have a value.

Valid modes are:

- debug
- concat
- compress

#### options.meta
Type: `Object`
Default value: `undefined`

An object containing meta variables to pass to all HTML templates being compiled.

#### options.partials
Type: `Object`
Default value: `undefined`

An object containing mustache partials to pass to all HTML templates being compiled.

#### options.jsMode
Type: `String`
Default value: `undefined`

A string value indicating what mode to compile JavaScript resources in.

Valid modes are:

- debug
- concat
- compress

#### options.jsDest
Type: `String`
Default value: `'js'`

A path to the base directory to save all JavaScript resources.

#### options.jsMinify
Type: `Function`
Default value: 

    function (content, callback) {
      require('yuicompressor').compress(content, {
        charset: 'utf8',
        type: 'js'
      }, callback);
    }

A function to minify JavaScript resources. This function will only be called when
JavaScript resources are compiled in `compress` mode.

#### options.cssMode
Type: `String`
Default value: `undefined`

A string value indicating what mode to compile Stylesheet resources in.

Valid modes are:

- debug
- concat
- compress

#### options.cssDest
Type: `String`
Default value: `'css'`

A path to the base directory to save all Stylesheet resources.

#### options.cssMinify
Type: `Function`
Default value: 

    function (content, callback) {
      require('yuicompressor').compress(content, {
        charset: 'utf8',
        type: 'css'
      }, callback);
    }

A function to minify Stylesheet resources. This function will only be called when
Stylesheet resources are compiled in `compress` mode.


### Usage Examples

#### Default Options
In this example, the default options are used to save all HTML pages in `web/pages`.

```js
grunt.initConfig({
  vanilla: {
    options: {},
    files: {
      'pages': ['src/*.html']
    }
  }
});
```

#### Custom Options
In this example, custom options are used to set the base output directory to `build` and all to save all JavaScript and Stylesheet resouces at the root of `build`.

```js
grunt.initConfig({
  vanilla: {
    options: {
      baseDest: 'build',
      jsDest: './',
      cssDest: './'
    },
    files: {
      'pages': ['src/*.html']
    }
  }
});
```

## Directives

The Vanilla compiler adds several capabilities to HTML, JS and CSS files by introducing several directives to each file type.
The compiler acts on the following directives and produces a result.

### JavaScript Directives

    // #import 'somefile.js'

The `import` directive provides a means to explicitly designate another script as a dependency.
When scripts are imported they are concatenated in such a way so that dependent scripts are referenced
first in the HTML markup. Additionally, cycles are handled with no side effects.

### Stylesheet Directives

    /* @@import 'somefile.js' */

The `import` directive provides a means to explicitly designate another stylesheet as a dependency.
When stylesheets are imported they are concatenated in such a way so that dependent stylesheets are referenced
first in the HTML markup. Additionally, cycles are handled with no side effects.

### HTML Directives

#### Meta Variables

    <v:meta></v:meta>
    <v:meta name="propertyname"></v:meta>

The meta directives provide a means for an HTML page to provide metadata and have it interpolated via [Hogan.js](http://twitter.github.io/hogan.js/)+[Beefcake.js](https://github.com/dschnare/beefcake.js) interpolation.
The `<v:meta></v:meta>` directive accepts an Object literal that is interpreted as JavaScript. Because this block is interpreted as JavaScript you can add methods to the meta object like this:

    <v:meta>
    {
      title: function () {
        return this.url.split('/').pop().split('.').shift().toUpperCase();
      }
    }
    </v:meta>

The `<v:meta name=""></v:meta>` directives accept text (or HTML) that can span multiple lines, but whose value will be saved
as the key of the same name as the `name` attribute on the `meta` object.

    <v:meta name="summary">
      This is a summary for the page or <strong>post</a>.
    </v:meta>

All meta variables will be mixed together from HTML template down to the template's layout and the layout's layout and so on. The mixing occurs by giving presedence to the higher-up meta variables (i.e. HTML template -> layout -> layout -> layout ...).
Meta variables are made available during mustache interpolation before an HTML template is saved.

There are several built-in meta variables made available to each HTML template. 

- url = The absolute URL of the HTML template.
- pages = An array of all page objects.

**NOTE:** These variables are undefined for HTML templates included via `<v:include>`.

Each page object has the following shape:

    {
      filePath: 'absolute file path to the HTML page',
      content: 'the HTML content of the page',
      meta: {... the meta variables for the HTML page ...},
      partials: {... the mustache partials exposed to the HTML page ...}
    }


#### Mustache Partials

    <v:partial name=""></v:partial>

These directives offer a mechanism to provide custom mustache partials used during mustache interpolation.

    <v:partial name="menuitem"><li><a href="{{meta.url}}">{{meta.title}}</a></li></v:partial>

    <ul class="menu">
    {{#pages}}
      {{>menuitem}}
    {{/pages}}
    </ul>

#### Resource Inclusion

    <v:include file|src="" />
    <v:script file|src="" [dest=""] />
    <v:stylesheet file|src="" [dest=""] />

These directives help you to include HTML, JS and CSS resources into your HTML templates.

The `<v:include file="" />` directive will inline an HTML file into an HTML template. This will recursively
compile the included file without saving, but instead inline the markup in-place. If the path is relative it
will be relative to the the including HTML template. If the file included is not an HTML file then it will be read
as a text file and inlined in-place.

In addition to inlining text content and/or parsing included HTML templates, any included file can be passed meta variables that will be used when the file is interpolated using mustache.

For example:

    <div class="footer">
      <v:include file="footer">
      {
        year: 2013,
        links: [
          {label: 'Terms', url: '/terms'},
          {label: 'Privacy', url: '/privacy'}
        ]
      }
      </v:include>
    </div>
    
Then in the included file:

    <p>Copyright {{year}}</p>
    <ul class="footer-links">
    {{#links}}
      <li><a href="{{url}}">{{label}}</a></li>
    {{/links}}
    </ul>

The `<v:script src="" />` and `<v:stylesheet src="" />` directives will embed script and stylesheet resources using
`<script>` and `<link>` elements. When a script or stylesheet is included in this way it will be compiled using the
Vanilla compiler, saved if not debugging and the appropriate embed element(s) will be inlined in-place.

Note that resources can be included by referencing a directory. If this is the case then the Vanilla compiler will attempt
to reference an `index.js` or `index.css` file within the directory.

    <v:script src="src/main" />

In this example we are actually referencing the file `src/main/index.js` and we are writing it to `{baseDir}/{jsDir}/main/index.js` when in `debug` mode.

The behaviour of the `<v:script src="" />` and `<v:stylesheet src="" />` changes depending on what `mode` the Vanilla
compiler compiles them with. Here's what to expect when compiling with each mode:

- debug (default) = This will copy all dependent resource files as-is to the appropriate directory and inline the files using the appropriate embed elements.
- concat = This will concatenate all dependent resource files into a single file then save it to the appropriate direcotry and inline the file using the appropriate embed element.
- compress = This will concatenate all dependent resource files into a single file, minify then save it to the appropriate direcotry and inline the file using the appropriate embed element.

#### Layouts
    
    <v:block name="" />
    <v:block name=""></v:block>

Any HTML template can function as a layout by using `<v:block name=""></v:block>` directives. Each block can be extended
by either being replaced, prepended to or appended to. Think of blocks as the areas of a layout that can be modified by
an extending HTML page.

**NOTE:** Blocks cannot be nested.

#### Layout Extension

    <v:extends|layout file|src="" />

    <v:prepend name=""></v:prepend>
    <v:replace name=""></v:replace>
    <v:append name=""></v:append>

Any HTML template can extend a layout, prepending, replacing or appending to the layout's defined blocks. If the path to the layout is
relative it will be resolved relative to the extending HTML template. The blocks available for extension is determined by the lowest layout in the
layout extension hierarchy.

For example:

base.html

    <html>
      <head>
        <v:block name="meta">
          <title>Index</title>
        </v:block>
      </head>
      <body>
        <v:block name="header" />
        <v:block name="body" />
        <v:block name="footer" />
      </body>
    </html>

page.html

    <v:extends file="./base.html" />

    <v:append name="meta">
      <meta charset="utf-8" />
    </v:append>

    <v:block name="ignored">
      This will be ignored.
    </v:block>


index.html

    <v:layout src="./page.html" />

    <v:replace name="body">
      <p>This is the body!</p>
    </v:replace>

    <v:append name="body">
      <p>This is more content added to the body.</p>
    </v:append>

    <v:block name="any">
      this should be ignored.
    </v:block>


result

    <html>
      <head>
        <title>Index</title><meta charset="utf-8" />
      </head>
      <body>
        
        <p>This is the body!</p><p>This is more content added to the body.</p>
        
      </body>
    </html>


## Directive Processing Order

For JavaScript and Stylesheet file types that only have one directive the order directives are processed is of no issue. However the order directives are processed in HTML templates will determine how you use each directive. Here's the order things occur:

1. Meta directives are parsed and removed
2. Resource inclusion directives (include, stylesheet, script) are parsed and inlined
3. Blocks are enumerated then extended (via append, prepend, replace) if the HTML template is being used as a layout, otherwise they are inlined as-is
4. Partials are parsed and removed
5. Block extensions are enumerated (append, prepend, replace) only if the HTML template has an `<v:extends>` directive
6. Mustache interpolation

The intension with this ordering is that blocks can be augmented by resource inclusion, and partials can be augmented by blocks and resource inclusion. As such, `<v:meta>`, `<v:extends|layout>`, `<v:append|prepend|replace>` and `<v:partial>` directives are meant to occur at the root level of an HTML template. All other directives can occur anywhere. And since all HTML templates are treated as just text files, proper XML/HTML format is not required to be followed. You can do something like this perfectly fine:

    <html>
    <head>
      <title><v:block name="title"> - My Site</v:block></title>
    </head>
    <body class="<v:block name="bodyclass">page</v:block>">
      The body
    </body>
    </html>

The fact that directives resemble HTML elements is irrelevant. Namespaced HTML elements was chosen so that editors could provide syntax highlighting without having to create a custom syntax file. And since most of the time these directives will be used under appropriate HTML rules it was deemed a good fit.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

**v0.0.5** First relase, used custom file wrangling code.

**v0.1.2** Added several new directives and improved stablity.

**v0.2.1** Standardized webPath option and added support for including module-like scripts from directories.

**v1.0.0** First Grunt plugin release that supported all directives.

**v1.0.1** Improved existing directives by adding ability to pass meta variables to included resources and to include non-HMTL resources via the `<v:include>` directive.