/** `Match` is result data of regular expression pattern matching.
 *
 * @constructor
 *
 * @param {string} input 
 * @param {Array.<number>} caps 
 * @param {Map} names 
 */
 Match = function(input, caps, names) {
    /** An input string of this matching.
     * @type {string}
     */
    this.input  = input;
    this._caps  = caps;
    this._names = names;

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
    const result = Match_resolve( this, k ),
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
    const i = Match_resolve( this, k )[ 0 ];

    return i < 0 ? undefined : i;
};

/** Get the end index of the capture `k`.
 * @param {(string|number)} k
 * @return {(number|undefined)}
 */
Match.prototype.end = function( k ){
    const j = Match_resolve( this, k )[ 1 ];

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
    if( k === k + '' ){ // typeof k === 'string'
        k = match._names.get( k );
        k  = k !== undefined ? k : -1;
    };
    var i = match._caps[ k * 2 ],
        j = match._caps[ k * 2 + 1 ];

    return [ 0 <= i ? i : -1, 0 <= j ? j : -1 ];
};

/** Convert this into `RegExp`'s result array.
 * @return {RegExpResult}
 */
Match.prototype.toArray = function(){
    // In TypeScript definition, `RegExpExecArray` extends `string[]`.
    // However the **real** `RegExpExecArray` can contain `undefined`.
    // So this method uses type casting to set properties.

    const l     = this.length;
    const array = new Array( l );
    array.index = this.index;
    array.input = this.input;

    for( let i = 0; i < l; ++i ){
        array[ i ] = this.get( i );
    };

    if( this._names.size > 0 ){
        const groups = {}, // <- Object.create( null ),
              names  = this._names;
        for( var name in names ){
            groups[ name ] = array[ names[ name ] ];
        };

        // `RegExpExecArray`'s group does not accept `undefined` value, so cast to `any` for now.
        array.groups = groups; // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
        // (array).groups = undefined;
    };

    return /** @type {RegExpResult} */ (array);
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    Match.prototype.toString = function(){
        const array = this.toArray();

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
        Match.prototype[ Symbol.for( 'nodejs.util.inspect.custom' ) ] = function( depth, options ){
            let s = options.stylize( 'Match', 'special' ) + ' [\n';
            const inverseNames = new Map( Array.from(this._names).map(([k, i]) => [i, k]) );

            for (let i = 0, _i; i < this.length; i++) {
                _i = inverseNames.get( i );
                const name = options.stylize(
                  JSON.stringify( _i != null ? _i : i ),
                  inverseNames.has( i ) ? 'string' : 'number'
                );
                let capture = this.get(i);
                if (capture === undefined) {
                  s += `  ${name} => ${options.stylize('undefined', 'undefined')},\n`;
                  continue;
                }
                const begin = options.stylize(this._caps[i * 2].toString(), 'number');
                const end = options.stylize(this._caps[i * 2 + 1].toString(), 'number');
                capture = options.stylize(JSON.stringify(capture), 'string');
                s += `  ${name} [${begin}:${end}] => ${capture},\n`;
            }
            s += ']';
            return s;
        };
    };
};
