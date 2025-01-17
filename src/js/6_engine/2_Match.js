/** `Match` is result data of regular expression pattern matching.
 *
 * @constructor
 *
 * @param {string} input 
 * @param {!Array.<number>} caps 
 * @param {!Array.<string|number>=} names 
 */
Match = function( input, caps, names ){
    /** An input string of this matching.
     * @type {string}
     */
    this.input  = input;
    this._caps  = caps;

    if( CONST_SUPPORT_ES2018 ){
        this._names = names;
    };

    /** Return the initial index of this matching.
     * @type {number}
     */
    this.index = caps[ 0 ];
    /** Return the last index of this matching.
     * @type {number}
     */
    this.lastIndex = caps[ 1 ];
    /**
     * Return number of capture group.
     *
     * This number contains capture `0` (whole matching) also.
     * @type {number}
     */
    this.length = caps.length / 2;
};

/** Get the capture `k`.
 * @param {(string|number)} k
 * @return {(string|undefined)}
 */
Match.prototype.get = function( k ){
    var result = Match_resolve( this, k ),
        i      = result[ 0 ],
        j      = result[ 1 ];

    if( i < 0 || j < 0 ){
        return undefined;
    };
    return this.input.slice( i, j );
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    /** Get the begin index of the capture `k`.
     * @param {(string|number)} k
     * @return {(number|undefined)}
     */
    Match.prototype.begin = function( k ){
        var i = Match_resolve( this, k )[ 0 ];

        return i < 0 ? undefined : i;
    };

    /** Get the end index of the capture `k`.
     * @param {(string|number)} k
     * @return {(number|undefined)}
     */
    Match.prototype.end = function( k ){
        var j = Match_resolve( this, k )[ 1 ];

        return j < 0 ? undefined : j;
    };
};

/**
 * Resolve name to capture index.
 *
 * If not resolved, it returns `-1`.
 * 
 * @param {!Match} match
 * @param {string|number} k 
 * @return {!Array.<number>}
 */
function Match_resolve( match, k ){
    if( CONST_SUPPORT_ES2018 && k === k + '' ){ // typeof k === 'string'
        k = m_getCaptureGroupIndexByName( /** @type {!Array.<string|number>} */ (match._names), k ); //
    };
    var i = match._caps[ k * 2 ],
        j = match._caps[ k * 2 + 1 ];

    return [ i !== undefined ? i : -1, j !== undefined ? j : -1 ];
};

/** Convert this into `RegExp`'s result array.
 * @return {!RegExpResult}
 */
Match.prototype.toArray = function(){
    // In TypeScript definition, `RegExpExecArray` extends `string[]`.
    // However the **real** `RegExpExecArray` can contain `undefined`.
    // So this method uses type casting to set properties.

    var l     = this.length;
    var array = [];
    array.index = this.index;
    array.input = this.input;

    for( var i = 0; i < l; ++i ){
        array[ i ] = this.get( i );
    };

    if( CONST_SUPPORT_ES2018 ){
        var names = this._names;

        l = names.length;
        if( 0 < l ){
            var groups = {}; // <- Object.create( null ),

            for( i = 0; i < l; i += 2 ){
                groups[ names[ i ] ] = array[ names[ i + 1 ] ];
            };

            // `RegExpExecArray`'s group does not accept `undefined` value, so cast to `any` for now.
            array.groups = groups;
        } else if( DEFINE_REGEXP_COMPAT__DEBUG ){
            array.groups = undefined;
        };
    } else if( DEFINE_REGEXP_COMPAT__DEBUG ){
        array.groups = undefined;
    };

    return /** @type {!RegExpResult} */ (array);
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    Match.prototype.toString = function(){
        var array = this.toArray();

        function show( x ){
            return x === undefined ? 'undefined' : JSON.stringify( x );
        };
        return 'Match[' + Array_map( array, show ).join( ', ' ) + ']';
    };

    if( DEFINE_REGEXP_COMPAT__NODEJS ){
      /**
       * @param {*} depth 
       * @param {!InspectOptionsStylized} options 
       * @return {string}
       */
        Match.prototype[ Symbol[ 'for' ]( 'nodejs.util.inspect.custom' ) ] = function( depth, options ){
            var s = options.stylize( 'Match', 'special' ) + ' [\n';
            var names = CONST_SUPPORT_ES2018 ? this._names : [];

            function getNameByIndex( index ){
                var _index = names.indexOf( index );

                return _index === -1 ? null : names[ _index - 1 ];
            };

            for( var i = 0, _i; i < this.length; i++ ){
                _i = getNameByIndex( i );
                var name = options.stylize(
                    JSON.stringify( _i != null ? _i : i ),
                    _i != null ? 'string' : 'number'
                );
                var capture = this.get( i );
                if( capture === undefined ){
                    s += '  ' + name + ' => ' + options.stylize( 'undefined', 'undefined' ) + ',\n';
                    continue;
                };
                var begin = options.stylize( this._caps[ i * 2 ].toString(), 'number' );
                var end = options.stylize( this._caps[ i * 2 + 1 ].toString(), 'number' );
                capture = options.stylize( JSON.stringify( capture ), 'string' );
                s += '  ' + name + ' [' + begin + ':' + end + '] => ' + capture + ',\n';
            };
            return s + ']';
        };
    };
};

if( DEFINE_REGEXP_COMPAT__NODEJS ){
    module[ 'exports' ][ 'Match' ] = Match;
};