const gulp            = require('gulp'),
      ClosureCompiler = require('google-closure-compiler').gulp,
      postProcessor   = require('es2-postprocessor'),
      es2toEs3        = require('es2-to-es3'),
      tempDir         = require('os').tmpdir() + '/ReRE.js',
      fs              = require( 'fs' ),
      args            = 'String, parseInt',
      package         = require('./package.json'),
      aboutReREjs     = 'v' + ( package.version || '0.0' ) + '(' + ( package.homepage || '?' ).split( '#' )[ 0 ] + ')';

let strCompileType     = 'develop'; // release | debug  | develop
let ecmaFeatureVersion = 2018;
let clientMinEsVersion = 3;
let isDataBuilder      = false;
let isNodejs           = false;
let templete, fileName;

gulp.task( '__compile', gulp.series(
    function(){
        console.log( '[' + strCompileType + ']', isNodejs ? 'Node' : 'ES' + clientMinEsVersion, 'Compatible:ES' + ecmaFeatureVersion );

        templete = '// [' + strCompileType + '] *** ReRE.js for ' +
                    (
                        isNodejs ? 'Node' : 'ES' + clientMinEsVersion
                    )
                    + ', Compatible:ES' + ecmaFeatureVersion + ', ' + aboutReREjs
                    + '\n%output%';

        fileName = isDataBuilder
                      ? 'data-builder.js'
                 : isNodejs
                      ? 'index' + ( strCompileType !== 'release' ? '.' + strCompileType : '' ) + '.js'
                      : 'ReRE.es' + clientMinEsVersion + '.' + ecmaFeatureVersion + '.' + strCompileType + '.js';

        return gulp.src(
            [
                './node_modules/google-closure-compiler/contrib/nodejs/globals.js',
                './src/closure-primitives/base.js',
                './src/js/**/*.js'
                // , './src/js/_generated.externs.js'
            ]
        ).pipe(
            ClosureCompiler(
                {
                    dependency_mode   : 'PRUNE',
                    entry_point       : 'goog:' + ( isDataBuilder ? 'dataBuilder' : isNodejs ? 'RegExpCompat.node' : 'RegExpCompat.browser' ),
                    define            : [
                        'vm.DEFINE.DEBUG='  + ( strCompileType !== 'release' && clientMinEsVersion !== 2 ),
                        'vm.DEFINE.MINIFY=' + ( strCompileType !== 'develop' && !isNodejs ),
                        'vm.DEFINE.CLIENT_MIN_ES_VERSION=' + clientMinEsVersion,
                        'vm.DEFINE.ES_FEATURE_VERSION='    + ecmaFeatureVersion
                    ],
                    compilation_level : strCompileType === 'develop' && clientMinEsVersion !== 2 ? 'SIMPLE' : 'ADVANCED',
                    // compilation_level : 'WHITESPACE_ONLY',
                    env               : 'CUSTOM',
                    formatting        : strCompileType !== 'release' || clientMinEsVersion < 5 ? 'PRETTY_PRINT' : 'SINGLE_QUOTES',
                    warning_level     : 'VERBOSE',
                    language_in       : 'ECMASCRIPT3',
                    language_out      : 'ECMASCRIPT3',
                    output_wrapper    : (
                                            isNodejs
                                                ? '%output%'
                                                : 'var RegExpCompat=(function(global, RegExp, Infinity, ' + args + ', __export__){' +
                                                        '%output%;return __export__;' +
                                                    '})(this, this.RegExp, 1/0, ' + args + ');'
                                        )
                }
            )
        ).pipe(
            ClosureCompiler(
                {
                    compilation_level : strCompileType === 'develop' ? 'WHITESPACE_ONLY' : 'SIMPLE',
                    formatting        : strCompileType !== 'release' ? 'PRETTY_PRINT' : 'SINGLE_QUOTES',
                    language_in       : 'ECMASCRIPT3',
                    language_out      : 'ECMASCRIPT3',
                    output_wrapper    : templete,
                    js_output_file    : ( !isDataBuilder && clientMinEsVersion < 5 ? 'pre-' : '' ) + fileName
                }
            )
        ).pipe(
            gulp.dest( isDataBuilder ? tempDir : isNodejs ? 'lib' : 5 <= clientMinEsVersion ? 'dist/' + strCompileType : tempDir )
        );
    },
    function( cb ){
        if( clientMinEsVersion !== 3 || isNodejs ){
            return cb();
        };
        console.log( 'ES3 ---' );
        return gulp.src(
            [ tempDir + '/pre-' + fileName ]
        ).pipe(
            ClosureCompiler(
                {
                    compilation_level : 'WHITESPACE_ONLY',
                    formatting        : strCompileType !== 'release' ? 'PRETTY_PRINT' : 'SINGLE_QUOTES',
                    // language_in       : 'ECMASCRIPT3',
                    language_out      : 'ECMASCRIPT3',
                    output_wrapper    : templete,
                    js_output_file    : fileName
                }
            )
        ).pipe(
            es2toEs3.gulp(
                {
                    minIEVersion : 7 // Embed Array.prototype.indexOf polyfill
                }
            )
        ).pipe( gulp.dest( 'dist/' + strCompileType ) );
    },
    function( cb ){
        if( clientMinEsVersion !== 2 || isNodejs ){
            return cb();
        };
        console.log( 'ES2 ---' );
        return gulp.src(
            [ tempDir + '/pre-' + fileName ]
        ).pipe(
            postProcessor.gulp(
                {
                    minIEVersion    : 5,
                    minOperaVersion : 7,
                    minGeckoVersion : 0.6
                }
            )
        ).pipe(
            ClosureCompiler(
                {
                    compilation_level : 'WHITESPACE_ONLY',
                    formatting        : strCompileType !== 'release' ? 'PRETTY_PRINT' : 'SINGLE_QUOTES',
                    // language_in       : 'ECMASCRIPT6',
                    language_out      : 'ECMASCRIPT3',
                    output_wrapper    : templete,
                    js_output_file    : fileName
                }
            )
        ).pipe(
            es2toEs3.gulp(
                {
                    minIEVersion : 5
                }
            )
        ).pipe( gulp.dest( 'dist/' + strCompileType ) );
    }
) );

gulp.task( '__compile_all_compileTypes', gulp.series(
    function( cb ){
        strCompileType = 'develop';cb();
    },
    '__compile',
    function( cb ){
        strCompileType = 'debug';cb();
    },
    '__compile',
    function( cb ){
        strCompileType = 'release';cb();
    },
    '__compile'
) );

gulp.task( '__compile_all_furetre', gulp.series(
    function( cb ){
        ecmaFeatureVersion = 2018;cb();
    },
    '__compile_all_compileTypes',
    function( cb ){
        ecmaFeatureVersion = 2015;cb();
    },
    '__compile_all_compileTypes',
    function( cb ){
        ecmaFeatureVersion = 3;cb();
    },
    '__compile_all_compileTypes'
) );

gulp.task( '__compile_all_target', gulp.series(
    function( cb ){
        isDataBuilder = isNodejs = false;
        clientMinEsVersion = 2;cb();
    },
    '__compile_all_furetre',
    function( cb ){
        clientMinEsVersion = 3;cb();
    },
    '__compile_all_furetre',
    function( cb ){
        clientMinEsVersion = 6;cb();
    },
    '__compile_all_furetre',
    function( cb ){
        isNodejs           = true;
        clientMinEsVersion = 6;
        ecmaFeatureVersion = 2018;cb();
    },
    '__compile_all_compileTypes'
) );

gulp.task( 'data',
    gulp.series(
        function( cb ){
            strCompileType = 'develop';
            isDataBuilder = isNodejs = true;
            cb();
        },
        '__compile',
        function( cb ){
            const dontEditMessage = '// THIS SCRIPT IS GENERATED BY "##". DO NOT EDIT!\n\n';
            const dataBuilderPath = tempDir + '/' + fileName;

            // Case folding
            let toolFileName = './src/js-tools/1_generateUnicodeFoldMap.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.unicodeFoldMap.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )()
            );
            // Case folding Legacy
            toolFileName = './src/js-tools/2_generateUnicodeFoldMapLegacy.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.unicodeFoldMapLegacy.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )()
            );
            // Unicode Category
            toolFileName = './src/js-tools/3_generateUnicodeCategory.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.unicodeCategory.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )( dataBuilderPath )
            );
            // Unicode Property
            toolFileName = './src/js-tools/4_generateUnicodeProperty.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/_generated.unicodeProperty.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )( dataBuilderPath )
            );
            // Unicode Property Alias
            toolFileName = './src/js-tools/5_generateUnicodePropertyAlias.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.unicodePropertyAlias.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )()
            );
            // Unicode Property Value Alias
            toolFileName = './src/js-tools/6_generateUnicodePropertyValueAlias.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.unicodePropertyValueAlias.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )()
            );
            // Unicode Script
            toolFileName = './src/js-tools/7_generateUnicodeScript.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.unicodeScript.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )( dataBuilderPath )
            );
            // 
            toolFileName = './src/js-tools/8_generateCharSetWordAndUnicodeWord.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/engine/_generated.ascii.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )( dataBuilderPath )
            );
            //
            toolFileName = './src/js-tools/9_generateCharSetIdStartAndIdContinue';

            fs.writeFileSync(
                './src/js/RegExpCompat/vm/syntax/_generated.charSet.ID_Start_ID_Continue.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )( dataBuilderPath )
            );
            // 
            toolFileName = './src/js-tools/A_generateExterns.js';

            fs.writeFileSync(
                './src/js/RegExpCompat/_generated.externs.js',
                dontEditMessage.replace( '##', toolFileName ) + require( toolFileName )()
            );
            cb();
        }
    )
);

gulp.task( 'dist', gulp.series(
    'data',
    '__compile_all_target'
) );
