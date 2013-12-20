/*
 * vanilla
 * https://github.com/dschnare/vanilla
 *
 * Copyright (c) 2013 Darren Schnare
 * Licensed under the MIT license.
 */
 
'use strict';

var VANILLA = require('./index');

module.exports = function(grunt) {

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
      task_test: {
        src: '../index.js'
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

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  
  grunt.registerTask('vanilla', function () {
    var done, options, files;
    
    done = this.async();
    options = this.options();
    files = this.files;
    
    console.log(files);
    
    done();
  });

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'vanilla', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
