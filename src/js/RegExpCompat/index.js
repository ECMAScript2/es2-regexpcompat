goog.provide( 'RegExpCompat' );

goog.requireType( 'vm.Program' );
goog.require( 'vm.SUPPORT_ES2018' );
goog.require( 'vm.shim.str.codePointAt' );
goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.Parser' );
goog.require( 'vm.Compiler' );
goog.require( 'vm.nodeToString' );
goog.require( 'vm.flagSetToString' );
goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.DEFINE.CLIENT_MIN_ES_VERSION' );
goog.require( 'vm.shim.ary.from' );
goog.require( 'vm.math.floor' );
goog.require( 'vm.math.min' );
goog.requireType( 'vm.d.FlagSet' );

goog.scope(
    function(){
        /**
         * @param {*} v 
         * @return {boolean} */
        function _isRegExp( v ){
            /** @suppress {checkRegExp} */
            v = !!v && !!RegExp && v.exec === RegExp.prototype.exec;
            return v;
        };

        /**
         * @param {*} v 
         * @return {boolean} */
        function _isRegExpOrRegExpCompat( v ){
            if( v && v.exec === RegExpCompat.prototype.exec ){
                return true;
            };
            return _isRegExp( v );
        };

        /**
         * @param {String} s
         * @param {number} i
         * @param {boolean=} unicode
         * @return {number} */
        function _advance( s, i, unicode ){
            if( !vm.SUPPORT_ES2018 || !unicode || i + 1 >= s.length ){
                return i + 1;
            };
            var c = vm.shim.str.codePointAt( s, i );
            c = c !== undefined ? c : 0;
            if( 0x10000 <= c ){
                return i + 2;
            };
            return i + 1;
        };

        var _debugCount = 10;
        var _skipCompare = true;

        /**
         * @param {!RegExp | !RegExpCompat} regExp 
         * @return {boolean} */
        function _debug( regExp ){
            return vm.DEFINE.DEBUG && global.console && regExp.regExp && 0 < _debugCount;
        };

        /**
         * @param {!RegExpCompat} regExpCompat 
         * @param {string} functionName 
         * @param {*} result1 
         * @param {*} result2 
         * @param {!Array} args */
        function _compare( regExpCompat, functionName, result1, result2, args ){
            if( _skipCompare ){
                return;
            };

            if( !!regExpCompat.lastIndex !== !!regExpCompat.regExp.lastIndex && regExpCompat.lastIndex !== regExpCompat.regExp.lastIndex ){
                console.log( 'regExpCompat.lastIndex missmatch! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '") ' +
                regExpCompat.lastIndex + '/' + regExpCompat.regExp.lastIndex );
                --_debugCount;
            };

            if( !result1 && !result2 ){
                return;
            };

            if( !result1 && result2 || result1 && !result2 ){
                console.log( '[0]Invalid Result! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '")' );
                console.dir( result1 );
                console.dir( result2 );
                --_debugCount;
                return;
            };

            if( result1.pop && result2.pop ){ // isArray
                if( result2.length   !== result1.length ||
                    result2.input    !== result1.input  ||
                    result2.index    !== result1.index  ||
                    !!result2.groups !== !!result1.groups
                ){
                    console.log( '[1]Invalid Result! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '")' );
                    console.dir( result1 );
                    console.dir( result2 );
                    --_debugCount;
                } else {
                    for( var i = 0, l = result2.length; i < l; ++i ){
                        if( result2[ i ] !== result1[ i ] &&
                            !( result2[ i ] === '' && result1[ i ] === undefined ) // for ie8-
                        ){
                            console.log( '[2]Invalid Result! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '")' );
                            console.dir( result1 );
                            console.dir( result2 );
                            --_debugCount;
                            break;
                        };
                    };
                };
            } else {

            };
        };

        /**
         * @constructor
         * @extends RegExp
         * @param {string | !RegExp | !RegExpCompat} source 
         * @param {string=} flags */
        RegExpCompat = function( source, flags ){
            if( vm.DEFINE.DEBUG ){
                if( /*new.target === undefined*/ !this || this.constructor !== RegExpCompat ){
                    if( _isRegExpOrRegExpCompat( source ) && flags === undefined ){
                        if( source.constructor === RegExpCompat ){
                            return source;
                        };
                    };
                    return new RegExpCompat( source, flags );
                };
                if( _isRegExpOrRegExpCompat( source ) ){
                    if( flags === undefined ){
                        flags = /** @type {!RegExp | !RegExpCompat} */ (source).flags;
                    };
                    source = /** @type {!RegExp | !RegExpCompat} */ (source).source;
                };
                source += '';
            };

            var parser = new vm.Parser( /** @type {string} */ (source), flags, true );
            var pattern = parser.parse();

            if( vm.DEFINE.DEBUG ){
                /** @type {!Pattern | void} */
                this.pattern = pattern;
            };

            var compiler = new vm.Compiler( pattern );

            /** @type {!vm.Program} */
            this.program = compiler.compile();

            var n = vm.nodeToString( pattern.child );

            /** @type {string} */
            this.source = n === '' ? '(?:)' : n;

            /** @type {string} */
            this.flags = vm.flagSetToString( pattern.flagSet );

            /** @type {boolean} */
            this.global = pattern.flagSet.global;

            /** @type {boolean} */
            this.ignoreCase = pattern.flagSet.ignoreCase;

            /** @type {boolean} */
            this.multiline = pattern.flagSet.multiline;

            this.sticky = /** @type {boolean} */ (pattern.flagSet.sticky);

            if( vm.SUPPORT_ES2018 ){
                this.dotAll  = /** @type {boolean} */ (pattern.flagSet.dotAll);
                this.unicode = /** @type {boolean} */ (pattern.flagSet.unicode);
            };

            if( vm.DEFINE.DEBUG ){
                this.regExp = new RegExp( source, this.flags ); // flags : 機能がパージされてる場合もあるので RegExpCompat で処理済のものを使う
                // this.regExp.compile();
                if( _debug( this ) && this.regExp.source !== this.source ){
                    console.log( 'RegExpCompat.source missmatch! RegExpCompat("' + source + '", "' + ( flags || '' ) + '")' );
                    --_debugCount;
                };
            };

            this.lastIndex = 0;
        };

        if( vm.DEFINE.DEBUG ){
            /** @suppress {deprecated} */
            RegExpCompat.__defineGetter__ &&
                [ '$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', 'lastMatch' ].forEach(
                    function( name ){
                        /** @suppress {deprecated} */
                        RegExpCompat.__defineGetter__(
                            name,
                            function(){
                                throw new Error( 'RegExpCompat does not support old RegExp.' + name + ' method' );
                            }
                        );
                    }
                );
            // RegExpCompat[ Symbol.species ] = RegExpCompat;

            /**
             * @suppress {checkTypes}
             * @return {!RegExpCompat} */
            RegExpCompat.prototype.compile = function(){
                return this;
            };

            // if( 6 <= vm.DEFINE.CLIENT_MIN_ES_VERSION && global.Symbol ){
            // RegExpCompat.prototype[ Symbol.match   ] = function(){ throw "Called Symbol.match!!" };
            // RegExpCompat.prototype[ Symbol.replace ] = function(){ throw "Called Symbol.replace!!" };
            // };
        };

        RegExpCompat.prototype.toString = function(){
            return '/' + this.source + '/' + this.flags;
        };

        /**
         * @param {*} string 
         * @return {!RegExpResult|null} */
        RegExpCompat.prototype.exec = function( string ){
            var update = this.global || this.sticky;

            var pos = 0;
            if( update ){
                pos = this.lastIndex;
            };
            var match = this.program.exec( /** @type {string} */ (string), pos );

            if( update ){
                this.lastIndex = match ? match.lastIndex : 0;
            };

            var regExpResultCompat = match ? match.toArray() : null;

            if( _debug( this ) ){
                _compare( this, 'exec', regExpResultCompat, this.regExp.exec( string ), [ string ] );
            };
            return regExpResultCompat;
        };

        /**
         * @param {*} string 
         * @return {boolean} */
        RegExpCompat.prototype.test = function( string ){
            _skipCompare = true;

            var result = !!this.exec( string );

            if( _debug( this ) ){
                _skipCompare = false;
                _compare( this, 'test', result, this.regExp.test( string ), [ string ] );
            };
            return result;
        };

        if( 6 <= vm.DEFINE.CLIENT_MIN_ES_VERSION && global.Symbol ){
            RegExpCompat.prototype[ Symbol.match   ] = function( str ){ return RegExpCompat_match( this, str ); };
            RegExpCompat.prototype[ Symbol.replace ] = function( str, replacer ){ return RegExpCompat_replace( this, str, replacer ); };
            RegExpCompat.prototype[ Symbol.search  ] = function( str ){ return RegExpCompat_search( this, str ); };
            /** @suppress {missingProperties} */
            RegExpCompat.prototype[ Symbol.split   ] = function( str, limit ){ return RegExpCompat_split( this, str, limit ); };
        } else {
            String.prototype._matchNativeForRegExpCompat = String.prototype.match;
            String.prototype.match = function( regExp ){
                return _isRegExpOrRegExpCompat( regExp ) ? RegExpCompat_match( /** @type {!RegExp | !RegExpCompat} */ (regExp), this ) : this._matchNativeForRegExpCompat( regExp );
            };

            String.prototype._replaceNativeForRegExpCompat = String.prototype.replace;
            String.prototype.replace = function( regExp, replacer ){
                return _isRegExpOrRegExpCompat( regExp ) ? RegExpCompat_replace( /** @type {!RegExp | !RegExpCompat} */ (regExp), this, replacer ) : this._replaceNativeForRegExpCompat( regExp, replacer );
            };

            String.prototype._searchNativeForRegExpCompat = String.prototype.search;
            String.prototype.search = function( regExp ){
                return _isRegExpOrRegExpCompat( regExp ) ? RegExpCompat_search( /** @type {!RegExp | !RegExpCompat} */ (regExp), this ) : this._searchNativeForRegExpCompat( regExp );
            };

            String.prototype._splitNativeForRegExpCompat = String.prototype.split;
            /** @type {function(this:(String|string), *=, number=):!Array<string>} */
            String.prototype.split = function( regExp, limit ){
                return _isRegExpOrRegExpCompat( regExp ) ? RegExpCompat_split( /** @type {!RegExp | !RegExpCompat} */ (regExp), /** @type {!String} */ (this), limit ) : this._splitNativeForRegExpCompat( regExp, limit );
            };
        };

        /**
         * @param {!RegExp | !RegExpCompat} regExp
         * @param {String} string 
         * @return {!RegExpResult|null} */
        function RegExpCompat_match( regExp, string ){
            _skipCompare = true;
            var result;
            
            if( regExp.global ){
                regExp.lastIndex = 0;
                result = [];
                for( var r; r = regExp.exec( string ) ; ){
                    result.push( r[ 0 ] );
                    if( r[ 0 ] === '' ){
                        regExp.lastIndex = vm.SUPPORT_ES2018 ? _advance( string, regExp.lastIndex, regExp.unicode ) : _advance( string, regExp.lastIndex );
                    };
                };
                result = result.length === 0 ? null : result;
            } else {
                result = regExp.exec( string );
            };
            if( _debug( regExp ) ){
                _skipCompare = false;
                _compare( /** @type {!RegExpCompat} */ (regExp), 'match', result, string.match( regExp.regExp ), [ string ] );
            };
            return /** @type {!RegExpResult} */ (result);
        };

        /**
         * @param {!RegExp | !RegExpCompat} regExp
         * @param {String} string 
         * @param {!function(string, ...?): *|null|string} replacer 
         * @return {string} */
        function RegExpCompat_replace( regExp, string, replacer ){
            _skipCompare = true;

            var replacerIsFunction = typeof replacer === 'function';
            var matches = [];
            var isGlobal = regExp.global;

            if( isGlobal ){
                regExp.lastIndex = 0;
            };

            // Collect matches to replace.
            // It must be done before building result string because
            // the replacer function calls `this.exec` and changes `this.lastIndex` maybe.
            for( var match; match = regExp.exec( string ); ){
                matches.push( match );
                if( !isGlobal ){
                    break;
                };
                if( match[ 0 ] === '' ){
                    regExp.lastIndex = vm.SUPPORT_ES2018 ? _advance( string, regExp.lastIndex, regExp.unicode ) : _advance( string, regExp.lastIndex );
                };
            };

            // Build a result string.
            var pos = 0;
            var result = [];
            var resultIndex = -1;
            var l = matches.length;
            for( var index = 0, match; index < l; ++index ){
                match = matches[ index ];
                result[ ++resultIndex ] = string.slice( pos, match.index );
                pos = match.index + match[ 0 ].length;

                if( replacerIsFunction ){
                    var args = vm.shim.ary.from( match );
                    args.push( match.index, string );
                    if( vm.SUPPORT_ES2018 && match.groups ){
                        args.push( match.groups );
                    };
                    result[ ++resultIndex ] = '' + replacer.apply( null, args );
                } else {
                    var i = 0;
                    for( ;; ){
                        var j = replacer.indexOf( '$', i );
                        if( j === -1 ){
                            result[ ++resultIndex ] = replacer.slice( i );
                            break;
                        };
                        result[ ++resultIndex ] = replacer.slice( i, j );
                        var c = replacer.charAt( j + 1 );
                        switch( c ){
                            case '$':
                                i = j + 2;
                                result[ ++resultIndex ] = '$';
                                break;
                            case '&':
                                i = j + 2;
                                result[ ++resultIndex ] = match[ 0 ];
                                break;
                            case '`':
                                i = j + 2;
                                result[ ++resultIndex ] = string.slice( 0, match.index );
                                break;
                            case "'":
                                i = j + 2;
                                result[ ++resultIndex ] = string.slice( pos );
                                break;
                            case '<':
                                // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
                                //   $<Name> 	ここで、Name はキャプチャするグループ名です。... 名前付きキャプチャグループに対応しているブラウザーのバージョンでのみ利用可能です。
                                if( vm.SUPPORT_ES2018 ){
                                    var k = replacer.indexOf( '>', j + 2 );
                                    if( regExp.program.names.length === 0 || k === -1 ){
                                        i = j + 2;
                                        result[ ++resultIndex ] = '$<';
                                        break;
                                    };
                                    var name = replacer.slice( j + 2, k );
                                    result[ ++resultIndex ] = match.groups && match.groups[ name ] || '';
                                    i = k + 1;
                                };
                                break;
                            default:
                                if( '0' <= c && c <= '9' ){
                                    var d = replacer.charAt( j + 2 );
                                    var s = '0' <= d && d <= '9' ? c + d : c;
                                    var n = + s; // <= Number.parseInt( s, 10 );
                                    if( 0 < n && n < match.length ){
                                        result[ ++resultIndex ] = match[ n ] || '';
                                        i = j + 1 + s.length;
                                        break;
                                    };
                                    n = vm.math.floor( n / 10 );
                                    if( 0 < n && n < match.length ){
                                        result[ ++resultIndex ] = match[ n ] || '';
                                        i = j + s.length;
                                        break;
                                    };
                                };
                                result[ ++resultIndex ] = '$';
                                i = j + 1;
                                break;
                        };
                    };
                };
            };

            result[ ++resultIndex ] = string.slice( pos );
            result = result.join( '' );

            if( _debug( regExp ) ){
                _skipCompare = true;
                _compare( /** @type {!RegExpCompat} */ (regExp), 'replace', result, string.replace( regExp.regExp, replacer ), [ string, replacer ] );
            };
            return result;
        };

        /**
         * @param {!RegExp | !RegExpCompat} regExp
         * @param {String} string
         * @return {number} */
        function RegExpCompat_search( regExp, string ){
            _skipCompare = true;

            var prevLastIndex = regExp.lastIndex;
            regExp.lastIndex = 0;
            var m = regExp.exec( string );
            regExp.lastIndex = prevLastIndex;
            var result = m ? m.index : -1;

            if( _debug( regExp ) ){
                _skipCompare = false;
                _compare( /** @type {!RegExpCompat} */ (regExp), 'search', result, string.search( regExp.regExp ), [ string ] );
            };
            return result;
        };

        /**
         * @param {!RegExp | !RegExpCompat} regExp
         * @param {String} string
         * @param {number=} limit
         * @return {!Array.<string>} */
        function RegExpCompat_split( regExp, string, limit ){
            _skipCompare = true;

            var flags       = regExp.sticky ? regExp.flags : regExp.flags + 'y';
            var Constructor = regExp.constructor;
            var species     = /* Constructor && Constructor[Symbol.species] || */ RegExpCompat;
            var splitter    = new species( regExp.source, flags ); // TODO .sticky フラグを立てて戻すだけで良さそう?
            limit = ( limit !== undefined ? limit : /* 2 ** 32 */ 4294967296 - 1 ) >>> 0;

            var result = [];
            var match;
        
            if( limit === 0 ){
                return result;
            };

            // Special case for empty string.
            if( /* string.length === 0 */ /** @type {*} */ (string) === '' ){
                match = splitter.exec( string );
                if( !match ){
                    result.push( string );
                };
            } else {
                var strLength = string.length;
                var p = 0;
                var q = p;
                var e, i, l;
                while( q < strLength ){
                    splitter.lastIndex = q;
                    match = splitter.exec( string );
                    if( !match ){
                        q = vm.SUPPORT_ES2018 ? _advance( string, q, regExp.unicode ) : _advance( string, q );
                        continue;
                    };

                    e = vm.math.min( splitter.lastIndex, strLength );
                    if( e === p ){
                        q = vm.SUPPORT_ES2018 ? _advance( string, q, regExp.unicode ) : _advance( string, q );
                        continue;
                    };

                    result.push( string.slice( p, q ) );
                    if( limit === result.length ){
                        return result;
                    };
                    p = e;
                    for( i = 1, l = match.length; i < l; ++i ){
                        result.push( match[ i ] );
                        if( limit === result.length ){
                            return result;
                        };
                    };

                    q = p;
                };

                result.push( string.slice( p ) );
            };

            if( _debug( regExp ) ){
                _skipCompare = false;
                _compare( /** @type {!RegExpCompat} */ (regExp), 'split', result, string.split( regExp.regExp, limit ), [ string, limit ] );
            };
            return result;
        };
    }
);
