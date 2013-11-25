# vanilla

> Simple HTML templating plugin that will also crawl JS and CSS dependencies.

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

    <v:meta></v:meta>
    <v:meta name="propertyname"></v:meta>

    <v:include file|src="" />
    <v:script file|src="" />
    <v:stylesheet file|src="" />

    <v:extends|layout file|src="" />
    <v:block name=""></v:block>

    <v:prepend name=""></v:prepend>
    <v:replace name=""></v:replace>
    <v:append name=""></v:append>

    <v:partial name=""></v:partial>

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_