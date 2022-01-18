/**
 * @param {*} argument 
 * @return {boolean}
 */
function isRegExp( argument ){
    if( argument && typeof argument === 'object' ){
        return !!argument[ Symbol.match ];
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
    if( !unicode || i + 1 >= s.length ){
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
function RegExpCompat( source, flags ){
    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        if( /*new.target === undefined*/ !this || this.constructor !== RegExpCompat ){
            if( isRegExp( source ) && flags === undefined ){
                if( source.constructor === RegExpCompat ){
                    return source;
                };
            };
            return new RegExpCompat( source, flags );
        };
    
        if( source instanceof RegExp || source instanceof RegExpCompat ){
            if( flags === undefined ){
                flags = source.flags;
            };
            source = source.source;
        };
    };

    var parser = new Parser( /** @type {string} */ (source), flags, true );
    var pattern = parser.parse();

    /** @type {Pattern} */
    this.pattern = pattern;

    var compiler = new Compiler( pattern );

    /** @type {Program} */
    this.program = compiler.compile();

    var n = nodeToString( pattern.child );

    /** @type {string} */
    this.source = n === '' ? '(?:)' : n;

    /** @type {string} */
    this.flags = flagSetToString( pattern.flagSet );

    /** @type {boolean} */
    this.global = pattern.flagSet.global;

    /** @type {boolean} */
    this.ignoreCase = pattern.flagSet.ignoreCase;

    /** @type {boolean} */
    this.multiline = pattern.flagSet.multiline;

    /** @type {boolean} */
    this.unicode = pattern.flagSet.unicode;

    /** @type {boolean} */
    this.sticky = pattern.flagSet.sticky;

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        this.dotAll = /** @type {boolean} */ (pattern.flagSet.dotAll);
    };
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
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

    RegExpCompat[ Symbol.species ] = RegExpCompat;

    RegExpCompat.prototype.toString = function(){
        return patternToString( this.pattern );
    };

    RegExpCompat.prototype.compile = function(){
        return this;
    };
};

/**
 * @param {string} string 
 * @return {RegExpResult|null}
 */
RegExpCompat.prototype.exec = function( string ){
    var update = this.global || this.sticky;

    var pos = 0;
    if( update ){
        pos = this.lastIndex;
    };
    var match = this.program.exec( string, pos );
    if( update ){
        this.lastIndex = match ? match.lastIndex : 0;
    };

    return match ? match.toArray() : null;
};

/**
 * @param {string} string 
 * @return {boolean}
 */
RegExpCompat.prototype.test = function( string ){
    return !!this.exec( string );
};

/**
 * @param {string} string 
 * @return {RegExpResult|Array<string>|null}
 */
RegExpCompat.prototype[Symbol.match] = function( string ){
    if( this.global ){
        this.lastIndex = 0;
        var result = [];
        for( var r; r = this.exec( string ) ; ){
            result.push( r[ 0 ] );
            if( r[ 0 ] === '' ){
                this.lastIndex = advance( string, this.lastIndex, this.unicode );
            };
        };
        return result.length === 0 ? null : result;
    };
    return this.exec( string );
};

RegExpCompat.prototype[Symbol.replace] = function( string, replacer ){
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
            this.lastIndex = advance( string, this.lastIndex, this.unicode );
        };
    };

    // Build a result string.
    var pos = 0;
    var result = '';
    var l = matches.length;
    for( var index = 0, match; index < l; ++index ){
        match = matches[ index ];
        result += string.slice( pos, match.index );
        pos = match.index + match[ 0 ].length;
        if( replacerIsFunction ){
            var args = Array_from( match );
            args.push( match.index, string );
            if( match.groups ){
                args.push( match.groups );
            };
            result += '' + replacer.apply( null, args );
        } else {
            var i = 0;
            for( ;; ){
                var j = replacer.indexOf( '$', i );
                result += replacer.slice( i, j === -1 ? string.length : j );
                if( j === -1 ){
                    break;
                };
                var c = replacer.charAt( j + 1 );
                switch( c ){
                    case '$':
                        i = j + 2;
                        result += '$';
                        break;
                    case '&':
                        i = j + 2;
                        result += match[ 0 ];
                        break;
                    case '`':
                        i = j + 2;
                        result += string.slice( 0, match.index );
                        break;
                    case "'":
                        i = j + 2;
                        result += string.slice( pos );
                        break;
                    case '<':
                        var k = replacer.indexOf( '>', j + 2 );
                        if( this.pattern.names._size === 0 || k === -1 ){
                            i = j + 2;
                            result += '$<';
                            break;
                        };
                        var name = replacer.slice( j + 2, k );
                        result += match.groups && match.groups[ name ] || '';
                        i = k + 1;
                        break;
                    default:
                        if( '0' <= c && c <= '9' ){
                            var d = replacer.charAt( j + 2 );
                            var s = '0' <= d && d <= '9' ? c + d : c;
                            var n = /* Number. */parseInt( s, 10 );
                            if( 0 < n && n < match.length ){
                                result += match[ n ] || '';
                                i = j + 1 + s.length;
                                break;
                            };
                            n = Math.floor( n / 10 );
                            if( 0 < n && n < match.length ){
                                result += match[ n ] || '';
                                i = j + s.length;
                                break;
                            };
                        };
                        result += '$';
                        i = j + 1;
                        break;
                };
            };
        };
    };

    result += string.slice( pos );
    return result;
};

RegExpCompat.prototype[Symbol.search] = function( string ){
    var prevLastIndex = this.lastIndex;
    this.lastIndex = 0;
    var m = this.exec( string );
    this.lastIndex = prevLastIndex;
    return m ? m.index : -1;
};

/**
 * @param {string} string
 * @param {number=} limit
 * @return {Array.<string>}
 */
RegExpCompat.prototype[Symbol.split] = function( string, limit ){
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
        return result;
    };

    var len = string.length;
    var p = 0;
    var q = p;
    var t;
    while( q < len ){
        splitter.lastIndex = q;
        match = splitter.exec( string );
        if( !match ){
            q = advance( string, q, this.unicode );
            continue;
        };

        var e = Math.min( splitter.lastIndex, len );
        if( e === p ){
            q = advance( string, q, this.unicode );
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
    return result;
};

window[ 'RegExpCompat' ] = RegExpCompat;
