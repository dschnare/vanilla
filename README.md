# Vanilla

> Simple text templating module.


## Install

```shell
npm install vanilla --save
```

## Usage

```javascript
var VANILLA, files, options;

VANILLA = require('vanilla');
files = [{
  src: './src/*.js',
  dest: './build'
}];
options = {
  js: {
    directivePrefix: '// #',
    directiveSuffix: '\n'
  }
};

VANILLA.compile(files), options, function (error) {
  if (error) {
    // something went wrong!
    throw error;
  } else {
    // files have been processed and saved into the appropriate destination directory
  }
});
```

## Options

The options pass values to processors and extends the processor pipeline. Each file type encoutered
can have its own options section in the options object, thereby allowing file types to have separate processor pipelines
and processor options. Here are the default options the engine uses:

```javascript
{
  // all file types have these options as their defaults
  defaults: {
    directivePrefix: '#',
    directiveSuffix: '\n',
    // Extend the processor pipeline.
    pipeline: function (pipeline) {
      // ...
    }
  },
  // all javascript files have these optiosn as their defaults 
  // (overriding the defaults above)
  js: {
    directivePrefix: '// #',
    directiveSuffix: '\n',
    mode: 'uncompressed',
    // Extend the processor pipeline.
    pipeline: function (pipeline) {
      // ...
    }
  },
  // all style sheet files have these optiosn as their defaults 
  // (overriding the defaults above)
  css: {
    directivePrefix: '/* #',
    directiveSuffix: '*/',
    mode: 'uncompressed',
    // Extend the processor pipeline
    pipeline: function (pipeline) {
      // ...
    }
  },
  // all HTML files have these optiosn as their defaults 
  // (overriding the defaults above)
  html: {
    directivePrefix: '<',
    directiveSuffix: '>',
    // Extend the processor pipeline
    pipeline: function (pipeline) {
      // ...
    }
  }
}
```

The options `directivePrefix` and `directiveSuffix` are used by all the builtin processors that process a directive.
The option `mode` is used by the builtin minifcation processor to determine if minification should occur or not. If `mode`
is `compress` then minification will occur otherwise it will be skipped.

## Getting Started

Vanilla provides a rich and simple templating API for any kind of text file. The processing engine is simple,
each file type has a processor pipeline associated to it. Each processor pipeline has several processors added to it.
A processor pipeline can have processors that are to run on a different phase/pass than other processors. All phases will
be ran in the order they are encountered from the processors. Processors can perform any step necessary to transform the text
file like process a directive, minify or transpile to javascript.

The common web file types extend their pipeline with several builtin processors. Each file type has a step that will interpolate
the file as a Lodash template using the `data` directive's data as the context (see below for an example of this directive). Also,
JavaScript and CSS files will be minified using YUI if and only if the `mode` option is set to `compress`.

The default processors exopse the following directives:

*NOTE:* All examples below are shown using the default prefix and suffixes used in JavaScript files. Directives have a prefix and a suffix
like the following `#` and `\n`:

    #directive somevalue

Directives can also appear as blocks. Block-level directives are closed by prefixing `/` to the directive name when closing, like the following:

    #directive
    Some block
    #/directive


### Directives

**data**

```javascript
// #data
{
  JavaScript object
}
// #/data
```

OR

```javascript
// #data propertyname
Multiline text
// #/data
```


**include**

```javascript
// #include path/to/file.ext
```

OR

```javascript
// #include path/to/file.ext
{
  JavaScript object to make available to the file for interpolation.
}
// #/include
```


**partial**

```javascript
// #partial name
Partial text template.
// #/partial
```

**block**

```javascript
// #block name
```

```javascript
// #block name
Body of the block.
// #/block
```

**replace**

```javascript
// #replace blockname
New block body.
// #/replace
```

**append**

```javascript
// #append blockname
Body of text to append to block.
// #/append
```

**prepend**

```javascript
// #prepend blockname
Body of text to prepend to block.
// #/prepend
```

**extends**

```javascript
// #extends path/to/file.ext
```

## Processor Extension API

TODO

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

# Roadmap

- Finish documentation of the builtin directives by example
- Document the processor extension API
- Clean up how data is passed to other processors (does it have to be the options object?)
- Use file streams to read files so that a predictable amount of memory is used per file, thereby enable the engine to work on large files

## Release History

**v2.0.0** Refactor engine so processors are generalized, making the engine easier to extend. All files are now treated equally.

**v1.0.2** Add `meta` and `partials` options, add caching to included resources.

**v1.0.1** Improved existing directives by adding ability to pass meta variables to included resources and to include non-HMTL resources via the `<v:include>` directive.

**v1.0.0** First Grunt plugin release that supported all directives.

**v0.2.1** Standardized webPath option and added support for including module-like scripts from directories.

**v0.1.2** Added several new directives and improved stablity.

**v0.0.5** First relase, used custom file wrangling code.