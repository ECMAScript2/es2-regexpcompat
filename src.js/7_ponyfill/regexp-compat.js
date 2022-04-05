/**
 * @param {*} argument 
 * @return {boolean}
 */
function isRegExp( argument ){
    if( argument && typeof argument === 'object' ){
        return argument.exec === RegExpCompat.prototype.exec;
    };
    return false;
};

/**
 * @param {string} s
 * @param {number} i
 * @param {boolean=} unicode
 * @return {number}
 */
function advance( s, i, unicode ){
    if( !DEFINE_REGEXP_COMPAT__ES2018 || !unicode || i + 1 >= s.length ){
        return i + 1;
    };
    var c = String_codePointAt( s, i );
    c = c !== undefined ? c : 0;
    if( 0x10000 <= c ){
        return i + 2;
    };
    return i + 1;
};

/**
 * @constructor
 * @extends RegExp
 * @param {string|RegExp|RegExpCompat} source 
 * @param {string=} flags
 */
RegExpCompat = function( source, flags ){
    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        if( /*new.target === undefined*/ !this || this.constructor !== RegExpCompat ){
            if( isRegExp( source ) && flags === undefined ){
                if( source.constructor === RegExpCompat ){
                    return source;
                };
            };
            return new RegExpCompat( source, flags );
        };
    
        /* if( source instanceof RegExp || source instanceof RegExpCompat ){
            if( flags === undefined ){
                flags = source.flags;
            };
            source = source.source;
        }; */
    };

    var parser = new Parser( /** @type {string} */ (source), flags, true );
    var pattern = parser.parse();

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        /** @type {Pattern} */
        this.pattern = pattern;
    };

    var compiler = new Compiler( pattern );

    /** @type {Program} */
    this.program = compiler.compile();

    var n = m_nodeToString( pattern.child );

    /** @type {string} */
    this.source = n === '' ? '(?:)' : n;

    /** @type {string} */
    this.flags = m_flagSetToString( pattern.flagSet );

    /** @type {boolean} */
    this.global = pattern.flagSet.global;

    /** @type {boolean} */
    this.ignoreCase = pattern.flagSet.ignoreCase;

    /** @type {boolean} */
    this.multiline = pattern.flagSet.multiline;

    this.sticky = /** @type {boolean} */ (pattern.flagSet.sticky);

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        this.dotAll  = /** @type {boolean} */ (pattern.flagSet.dotAll);
        this.unicode = /** @type {boolean} */ (pattern.flagSet.unicode);
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        this.regExp = new RegExp( source, this.flags ); // 機能がパージされてる場合もあるので RegExpCompat で処理済のものを使う
        // this.regExp.compile();
        if( RegExpCompat_debug( this ) && this.regExp.source !== this.source ){
            console.log( 'RegExpCompat.source missmatch! RegExpCompat("' + source + '", "' + ( flags || '' ) + '")' );
            --RegExpCompat_debugCount;
        };
    };
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    if( RegExpCompat.__defineGetter__ ){
        [ '$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', 'lastMatch' ].forEach(
            function( name ){
                RegExpCompat.__defineGetter__(
                    name,
                    function(){
                        throw new Error( 'RegExpCompat does not support old RegExp.' + name + ' method' );
                    }
                );
            }
        );
    };


    // RegExpCompat[ Symbol.species ] = RegExpCompat;

    RegExpCompat.prototype.compile = function(){
        /* return this; */
    };

    if( this.Symbol ){
      // Not for ES2
      // RegExpCompat.prototype[ Symbol.match   ] = function(){ throw "Called Symbol.match!!" };
      // RegExpCompat.prototype[ Symbol.replace ] = function(){ throw "Called Symbol.replace!!" };
    };

    /** @type {!{log:!Function,dir:!Function}} */
    var console = this.console;
};

RegExpCompat.prototype.toString = function(){
    return '/' + this.source + '/' + this.flags;
};

var RegExpCompat_debugCount = 10;
var RegExpCompat_skipCompare = true;

/**
 * @param {RegExpCompat} regExpCompat 
 * @return {boolean}
 */
function RegExpCompat_debug( regExpCompat ){
    return DEFINE_REGEXP_COMPAT__DEBUG && console && regExpCompat.regExp && 0 < RegExpCompat_debugCount;
};

/**
 * 
 * @param {RegExpCompat} regExpCompat 
 * @param {string} functionName 
 * @param {*} result1 
 * @param {*} result2 
 * @param {Array} args
 */
function RegExpCompat_compare( regExpCompat, functionName, result1, result2, args ){
    if( RegExpCompat_skipCompare ){
        return;
    };

    if( !!regExpCompat.lastIndex !== !!regExpCompat.regExp.lastIndex && regExpCompat.lastIndex !== regExpCompat.regExp.lastIndex ){
        console.log( 'regExpCompat.lastIndex missmatch! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '") ' +
        regExpCompat.lastIndex + '/' + regExpCompat.regExp.lastIndex );
        --RegExpCompat_debugCount;
    };

    if( !result1 && !result2 ){
        return;
    };

    if( !result1 && result2 || result1 && !result2 ){
        console.log( '[0]Invalid Result! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '")' );
        console.dir( result1 );
        console.dir( result2 );
        --RegExpCompat_debugCount;
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
            --RegExpCompat_debugCount;
        } else {
            for( var i = 0, l = result2.length; i < l; ++i ){
                if( result2[ i ] !== result1[ i ] &&
                    !( result2[ i ] === '' && result1[ i ] === undefined ) // for ie8-
                ){
                    console.log( '[2]Invalid Result! RegExpCompat("' + regExpCompat.source + '", "' + regExpCompat.flags + '").' + functionName + '("' + args.join( ',' ) + '")' );
                    console.dir( result1 );
                    console.dir( result2 );
                    --RegExpCompat_debugCount;
                    break;
                };
            };
        };
    } else {

    };
};

/**
 * @param {*} string 
 * @return {RegExpResult|null}
 */
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

    if( !RegExpCompat_debug( this ) ){
        return regExpResultCompat;
    };

    RegExpCompat_compare( this, 'exec', regExpResultCompat, this.regExp.exec( string ), [ string ] );

    return regExpResultCompat;
};

/**
 * @param {*} string 
 * @return {boolean}
 */
RegExpCompat.prototype.test = function( string ){
    RegExpCompat_skipCompare = true;

    var result = !!this.exec( string );

    if( !RegExpCompat_debug( this ) ){
        return result;
    };

    RegExpCompat_skipCompare = false;
    RegExpCompat_compare( this, 'test', result, this.regExp.test( string ), [ string ] );

    return result;
};

/**
 * @param {string} string 
 * @return {RegExpResult|Array<string>|null}
 */
RegExpCompat.prototype[ 'match' ] = function( string ){
    RegExpCompat_skipCompare = true;
    var result;
    
    if( this.global ){
        this.lastIndex = 0;
        result = [];
        for( var r; r = this.exec( string ) ; ){
            result.push( r[ 0 ] );
            if( r[ 0 ] === '' ){
                this.lastIndex = DEFINE_REGEXP_COMPAT__ES2018 ? advance( string, this.lastIndex, this.unicode ) : advance( string, this.lastIndex );
            };
        };
        result = result.length === 0 ? null : result;
    } else {
        result = this.exec( string );
    };
    if( !RegExpCompat_debug( this ) ){
        return result;
    };

    RegExpCompat_skipCompare = false;
    RegExpCompat_compare( this, 'match', result, string.match( this.regExp ), [ string ] );

    return result;
};

/**
 * @param {string} string 
 * @param {Function|string} replacer 
 * @return {string}
 */
RegExpCompat.prototype[ 'replace' ] = function( string, replacer ){
    RegExpCompat_skipCompare = true;

    var replacerIsFunction = typeof replacer === 'function';
    var matches = [];

    if( this.global ){
        this.lastIndex = 0;
    };

    // Collect matches to replace.
    // It must be done before building result string because
    // the replacer function calls `this.exec` and changes `this.lastIndex` maybe.
    for( var match; match = this.exec( string ); ){
        matches.push( match );
        if( !this.global ){
            break;
        };
        if( match[ 0 ] === '' ){
            this.lastIndex = DEFINE_REGEXP_COMPAT__ES2018 ? advance( string, this.lastIndex, this.unicode ) : advance( string, this.lastIndex );
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
            var args = Array_from( match );
            args.push( match.index, string );
            if( DEFINE_REGEXP_COMPAT__ES2018 && match.groups ){
                args.push( match.groups );
            };
            result[ ++resultIndex ] = '' + replacer.apply( null, args );
        } else {
            var i = 0;
            for( ;; ){
                var j = replacer.indexOf( '$', i );
                if( j === -1 ){
                    result[ ++resultIndex ] = replacer;
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
                        if( DEFINE_REGEXP_COMPAT__ES2018 ){
                            var k = replacer.indexOf( '>', j + 2 );
                            if( this.program.names._size === 0 || k === -1 ){
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
                            var n = s - 0; // Number.parseInt( s, 10 );
                            if( 0 < n && n < match.length ){
                                result[ ++resultIndex ] = match[ n ] || '';
                                i = j + 1 + s.length;
                                break;
                            };
                            n = Math_floor( n / 10 );
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

    if( !RegExpCompat_debug( this ) ){
        return result;
    };

    RegExpCompat_skipCompare = false;
    RegExpCompat_compare( this, 'replace', result, string.replace( this.regExp, replacer ), [ string, replacer ] );

    return result;
};

/**
 * @param {string} string
 * @return {number}
 */
RegExpCompat.prototype.search = function( string ){
    RegExpCompat_skipCompare = true;

    var prevLastIndex = this.lastIndex;
    this.lastIndex = 0;
    var m = this.exec( string );
    this.lastIndex = prevLastIndex;
    var result = m ? m.index : -1;

    if( !RegExpCompat_debug( this ) ){
        return result;
    };

    RegExpCompat_skipCompare = false;
    RegExpCompat_compare( this, 'search', result, this.regExp.search( string ), [ string ] );

    return result;
};

/**
 * @param {string} string
 * @param {number=} limit
 * @return {Array.<string>}
 */
RegExpCompat.prototype.split = function( string, limit ){
    RegExpCompat_skipCompare = true;

    var flags       = this.sticky ? this.flags : this.flags + 'y';
    var constructor = this.constructor;
    var species     = /* constructor && constructor[Symbol.species] || */ RegExpCompat;
    var splitter    = new species( this.source, flags );
    limit = ( limit !== undefined ? limit : /* 2 ** 32 */ 4294967296 - 1 ) >>> 0;

    var result = [];
    var match;
  
    if( limit === 0 ){
        return result;
    };

    // Special case for empty string.
    if( /* string.length === 0 */ string === '' ){
        match = splitter.exec( string );
        if( !match ){
            result.push( string );
        };
    } else {
        var len = string.length;
        var p = 0;
        var q = p;
        var t;
        while( q < len ){
            splitter.lastIndex = q;
            match = splitter.exec( string );
            if( !match ){
                q = DEFINE_REGEXP_COMPAT__ES2018 ? advance( string, q, this.unicode ) : advance( string, q );
                continue;
            };

            var e = Math.min( splitter.lastIndex, len );
            if( e === p ){
                q = DEFINE_REGEXP_COMPAT__ES2018 ? advance( string, q, this.unicode ) : advance( string, q );
                continue;
            };

            t = string.slice( p, q );
            result.push( t );
            if( limit === result.length ){
                return result;
            };
            p = e;
            for( var i = 1, l = match.length; i < l; ++i ){
                result.push( match[ i ] );
                if( limit === result.length ){
                    return result;
                };
            };

            q = p;
        };

        t = string.slice( p );
        result.push( t );
    };

    if( !RegExpCompat_debug( this ) ){
        return result;
    };

    RegExpCompat_skipCompare = false;
    RegExpCompat_compare( this, 'split', result, this.regExp.split( string, limit ), [ string, limit ] );

    return result;
};

if( DEFINE_REGEXP_COMPAT__NODEJS ){
    if( this.module ){
        this.module.exports = RegExpCompat;
    };
};

if( DEFINE_REGEXP_COMPAT__EXPORT_BY_RETURN ){
    return RegExpCompat;
};
