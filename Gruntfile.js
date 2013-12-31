/*
 * vanilla
 * https://github.com/dschnare/vanilla
 *
 * Copyright (c) 2013 Darren Schnare
 * Licensed under the MIT license.
 */
 
'use strict';

var VANILLA = require('./index');

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'lib/processor/*.js',
        'lib/processor/lib/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },
    
    vanilla: {
      default_layout: {
        src: 'test/fixtures/default_layout/index.html',
        dest: 'tmp/default_layout/index.html'
      },
      extension_layout: {
        src: 'test/fixtures/extension_layout/index.html',
        dest: 'tmp/extension_layout/index.html'
      },
      nested_layout: {
        src: 'test/fixtures/nested_layout/index.html',
        dest: 'tmp/nested_layout/index.html'
      },
      includes: {
        src: 'test/fixtures/includes/index.html',
        dest: 'tmp/includes/index.html'
      },
      data: {
        src: 'test/fixtures/data/index.html',
        dest: 'tmp/data/index.html'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // The vanilla task (eventually this should be a Grunt plugin)
  grunt.registerMultiTask('vanilla', function () {
    var done = this.async();
    
    VANILLA.compile(this.files.map(function (file) {
      return {
        src: file.src.shift(), // Only take the first src value; doesn't make sense any other way
        dest: file.dest
      };
    }), this.options(), function (error) {
      if (error) {
        throw error;
        // done(false);
      } else {
        done();
      }
    });
  });
  
  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'vanilla', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
