/** `Match` is result data of regular expression pattern matching.
 *
 * @constructor
 *
 * @param {string} input 
 * @param {Array.<number>} caps 
 * @param {Object<string, number>=} names 
 */
Match = function( input, caps, names ){
    /** An input string of this matching.
     * @type {string}
     */
    this.input  = input;
    this._caps  = caps;

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
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

/**
 * Resolve name to capture index.
 *
 * If not resolved, it returns `-1`.
 * 
 * @param {Match} match
 * @param {string|number} k 
 * @return {Array.<number>}
 */
function Match_resolve( match, k ){
    if( DEFINE_REGEXP_COMPAT__ES2018 && k === k + '' ){ // typeof k === 'string'
        k = match._names[ k ];
        k  = k !== undefined ? k : -1;
    };
    var i = match._caps[ k * 2 ],
        j = match._caps[ k * 2 + 1 ];

    return [ i !== undefined ? i : -1, j !== undefined ? j : -1 ];
};

/** Convert this into `RegExp`'s result array.
 * @return {RegExpResult}
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

    if( DEFINE_REGEXP_COMPAT__ES2018 && this._names._size > 0 ){
        var groups = {}, // <- Object.create( null ),
            names  = this._names;
        for( var name in names ){
            groups[ name ] = array[ names[ name ] ];
        };

        // `RegExpExecArray`'s group does not accept `undefined` value, so cast to `any` for now.
        array.groups = groups;
    // } else {
        // (array).groups = undefined;
    };

    return /** @type {RegExpResult} */ (array);
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
       * @param {InspectOptionsStylized} options 
       * @return {string}
       */
        Match.prototype[ Symbol[ 'for' ]( 'nodejs.util.inspect.custom' ) ] = function( depth, options ){
            var s = options.stylize( 'Match', 'special' ) + ' [\n';
            var inverseNames = new Map(
                    Array.from( DEFINE_REGEXP_COMPAT__ES2018 ? this._names : {} ).map( function( ki ){ return [ ki[ 1 ], ki[ 0 ] ]; } ) );

            for( var i = 0, _i; i < this.length; i++ ){
                _i = inverseNames.get( i );
                var name = options.stylize(
                    JSON.stringify( _i != null ? _i : i ),
                    inverseNames.has( i ) ? 'string' : 'number'
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
