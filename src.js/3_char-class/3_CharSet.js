/** The maximum valid code point of Unicode. */
var MAX_CODE_POINT = 0x110000;

/** `CharSet` is a set of code points. */

/**
 * Internal data of this.
 *
 * This is a sorted number array.
 * An odd element is begin of a range, and an even element is end of a range.
 * So, this array's size must be even always.
 *
 * ```typescript
 * var set = new CharSet();
 * set.add(10, 20);
 * set.add(30, 40)
 * console.log(set.data);
 * // => [10, 20, 30, 40]
 * ```
 */

/**
 * @constructor
 * @param {Array.<number>=} data
 */
CharSet = function( data ){
    /**
     * @type {Array.<number>}
     */
    this.data = data || [];
};

/** Add a range to this.
 * @param {number} begin
 * @param {number=} opt_end
 */
CharSet.prototype.add = function( begin, opt_end ){
    var data = this.data;
    var end  = opt_end || begin + 1;

    var i = CharSet_searchBegin( data, begin );
    var j = CharSet_searchEnd( data, end );

    var removed = data.splice( i * 2, ( j - i + 1 ) * 2 );
    if( removed.length > 0 ){
        begin = Math.min( begin, removed[ 0 ] );
        end   = Math.max( end, removed[ removed.length - 1 ] );
    };

    data.splice( i * 2, 0, begin, end );
};

/** Add another `CharSet` to this.
 *  @param {CharSet} charSet
 */
CharSet.prototype.addCharSet = function( charSet ){
    var newData = charSet.data,
        begin, end;

    for( var i = -1, l = newData.length - 1; i < l; ){
        begin = newData[ ++i ];
        end   = newData[ ++i ];
        this.add( begin, end );
    };
};

/** Invert this set.
 *
 * Note that this method is mutable like `Array.prototype.reverse`.
 * Please clone before this if immutable is desired.
 * 
 * @return {CharSet}
 */
CharSet.prototype.invert = function(){
    var data = this.data;

    if( data.length === 0 ){
        data.push( 0, MAX_CODE_POINT );
        return this;
    };

    if( data[ 0 ] === 0 && data[ data.length - 1 ] === MAX_CODE_POINT ){
        data.shift();
        data.pop();
        return this;
    };

    data.unshift( 0 );
    data.push( MAX_CODE_POINT );
    return this;
};

/** Clone this set.
 * @return {CharSet}
 */
CharSet.prototype.clone = function(){
    return new CharSet( Array_from( this.data ) );
};

/** Check is a code point contained in this set.
 * @param {number} c
 * @return {boolean}
 */
CharSet.prototype.has = function( c ){
    var data = this.data;
    var i = CharSet_searchEnd( data, c );

    if( i < 0 || data.length <= i * 2 ){
        return false;
    };
    var begin = data[ i * 2 ];
    var end   = data[ i * 2 + 1 ];
    return begin <= c && c < end;
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    /** Convert this into `RegExp` char-class pattern string.
     *
     * @param {boolean=} opt_invert
     */
    CharSet.prototype.toRegExpPattern = function( opt_invert ){
        var s = opt_invert ? '[^' : '[';

        for( var i = -1, data = this.data, l = data.length - 1; i < l; ){
            var begin = data[ ++i ];
            var end   = data[ ++i ];
            s += m_escapeCodePointAsRegExpSpurceChar( begin, true );
            if( begin !== end - 1 ){
                s += '-' + m_escapeCodePointAsRegExpSpurceChar( end - 1, true );
            };
        };

        return s + ']';
    };

    CharSet.prototype.toString = function(){
        return 'CharSet' + this.toRegExpPattern();
    };

    if( DEFINE_REGEXP_COMPAT__NODEJS ){
      /**
       * @param {*} depth 
       * @param {InspectOptionsStylized} options 
       * @return {string}
       */
        CharSet.prototype[ Symbol[ 'for' ]( 'nodejs.util.inspect.custom' ) ] = function( depth, options ){
            return options.stylize( 'CharSet', 'special' ) + ' ' +
                   options.stylize( this.toRegExpPattern(), 'regexp' );
        };
    };
};

/** Find the least `i` such that satisfy `c <= this.data[i * 2 + 1]`.
 * @param {Array.<number>} data
 * @param {number} c
 * @return {number}
 */
function CharSet_searchBegin( data, c ){
    var min  = -1;
    var max  = data.length / 2;

    while( max - min > 1 ){
        var mid = min + Math_floor( ( max - min ) / 2 );
        if( c <= data[ mid * 2 + 1 ] ){
            max = mid;
        } else {
            min = mid;
        };
    };
    return max;
};

/** Find the maximum `j` such that satisfy `this.ranges[j * 2] <= c`.
 * @param {Array.<number>} data
 * @param {number} c
 * @return {number}
 */
function CharSet_searchEnd( data, c ){
    var min  = -1;
    var max  = data.length / 2;

    while( max - min > 1 ){
        var mid = min + Math_floor( ( max - min ) / 2 );
        if( data[ mid * 2 ] <= c ){
            min = mid;
        } else {
            max = mid;
        };
    };
    return min;
};
