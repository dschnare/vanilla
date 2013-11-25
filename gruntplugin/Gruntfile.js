/*
 * vanilla
 * https://github.com/dschnare/vanilla
 *
 * Copyright (c) 2013 Darren Schnare
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    vanilla: {
      options: {
        baseDest: 'tmp'
      },
      default_layout: {
        files: [{
          expand: true,
          cwd: 'test/fixtures/default_layout',
          src: 'index.html',
          dest: 'default_layout'
        }]
      },
      extension_layout: {
        files: [{
          expand: true,
          cwd: 'test/fixtures/extension_layout',
          src: 'index.html',
          dest: 'extension_layout'
        }]
      },
      nested_layout: {
        files: [{
          expand: true,
          cwd: 'test/fixtures/nested_layout',
          src: 'index.html',
          dest: 'nested_layout'
        }]
      },
      includes: {
        files: [{
          expand: true,
          cwd: 'test/fixtures/includes',
          src: 'index.html',
          dest: 'includes'
        }]
      },
      resources_debug: {
        options: {
          mode: 'debug',
          jsDest: 'resources_debug/js'
        },
        files: [{
          expand: true,
          cwd: 'test/fixtures/resources',
          src: 'index.html',
          dest: 'resources_debug'
        }]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

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
