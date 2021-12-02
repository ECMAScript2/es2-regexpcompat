const gulp   = require('gulp'),
      closureCompiler = require('google-closure-compiler').gulp();

gulp.task( 'js', gulp.series(
  function(){
      return gulp.src(
          [
                './lib/index.es6.js'
          ]
      ).pipe(
          closureCompiler(
              {
                  // externs           : externs,
                  // define            : [],
                  // compilation_level : 'ADVANCED',
                  // compilation_level : 'WHITESPACE_ONLY',
                  formatting        : 'PRETTY_PRINT',
                  warning_level     : 'VERBOSE',
                  language_in       : 'ECMASCRIPT_2020',
                  language_out      : 'ECMASCRIPT5',
                  output_wrapper    : '(function(){\n%output%\n})()',
                  js_output_file    : 'ReRE.es5.js'
              }
          )
      ).pipe( gulp.dest( 'lib' ) );
  }
) );
