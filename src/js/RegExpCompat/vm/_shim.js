goog.provide( 'vm.shim.str.fromCodePoint' );
goog.provide( 'vm.shim.str.codePointAt' );
goog.provide( 'vm.shim.str.padStringWithZero' );
goog.provide( 'vm.shim.str.padEndWithSpace' );
goog.provide( 'vm.shim.str.startsWith' );
goog.provide( 'vm.shim.ary.from' );
goog.provide( 'vm.shim.ary.map' );
goog.provide( 'vm.shim.ary.reduceRight' );

goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.str.fromCharCode' );

/**
 * オリジナルから、引数を一つに変更
 * original:
 *   https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/string.polyfill.js#L39
 * @param {number} codePoint
 * @return {string} */
vm.shim.str.fromCodePoint = function( codePoint ){
    var highSurrogate;
    var lowSurrogate;
    var result;

    if( vm.DEFINE.DEBUG ){
        if(
            !isFinite( codePoint ) ||
            codePoint < 0 ||
            codePoint > 0x10ffff ||
            vm.math.floor( codePoint ) != codePoint
        ){
            throw RangeError( 'Invalid code point: ' + codePoint );
        };
    };

    if( codePoint <= 0xffff ){
        // BMP code point
        result = vm.str.fromCharCode( codePoint );
    } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xd800;
        lowSurrogate  = (codePoint % 0x400) + 0xdc00;
        result = vm.str.fromCharCode( highSurrogate ) + vm.str.fromCharCode( lowSurrogate );
    };
    return result;
};

/**
 * original:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt#polyfill
 * @param {string|String} string
 * @param {number} index
 * @return {number | void} */
vm.shim.str.codePointAt = function( string, index ){
    var size = string.length;

    // Account for out-of-bounds indices:
    if( index < 0 || index >= size ){
        return undefined;
    };
    // Get the first code unit
    var first = string.charCodeAt( index );
    var second;
    if( // check if it’s the start of a surrogate pair
        first >= 0xD800 && first <= 0xDBFF && // high surrogate
        size > index + 1 // there is a next code unit
    ){
        second = string.charCodeAt( index + 1 );
        if( second >= 0xDC00 && second <= 0xDFFF ){ // low surrogate
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            return ( first - 0xD800 ) * 0x400 + second - 0xDC00 + 0x10000;
        };
    };
    return first;
};

/**
 * original:
 *   https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/string.polyfill.js#L291
 *
 * @param {string} str
 * @param {number} targetLength
 * @return {string} */
vm.shim.str.padStringWithZero = function( str, targetLength ){
    // targetLength = targetLength >> 0; //floor if number or convert non-number to 0;

    if( targetLength <= str.length ){
        return str;
    } else {
        return ( '0000' + str ).substr( 4 - targetLength + str.length );
    };
};

/**
 * original:
 *   https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/string.polyfill.js#L264
 *
 * @param {string} str
 * @param {number} targetLength
 * @return {string} */
vm.shim.str.padEndWithSpace = function( str, targetLength ){
    if( targetLength <= str.length ){
        return str;
    } else {
        return ( str + '             ' ).substr( 0, targetLength );
    };
};

/**
 * original:
 *   https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#polyfill
 * @param {string} str
 * @param {string} search
 * @param {number} pos */
vm.shim.str.startsWith = function( str, search, pos ){
    return str.substr( pos, search.length ) === search;
};

/**
 * @param {!Array} array
 * @return {!Array} */
vm.shim.ary.from = function( array ){
    return array.concat();
};

/**
 * original
 *   https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/array.polyfill.js#L926
 * 
 * @param {!Array} array
 * @param {!Function} callback
 * @return {!Array} */
vm.shim.ary.map = function( array, callback ){
    var l = array.length,
        result = [];

    while( l ){
        result[ --l ] = callback( array[ l ], l );
    };
    return result;
};

/**
 * @param {!Array} array
 * @param {!function(*,*):*} callback
 * @return {*} */
vm.shim.ary.reduceRight = function( array, callback /*, initialValue*/ ){
    var len   = array.length >>> 0,
        k     = len - 1,
        value = array[ k-- ];

    for( ; 0 <= k; --k ){
        value = callback( value, array[ k ] /* , k, array */ );
    };
    return value;

    /** TODO
     * var i = array.length - 1;
     *     v = array[ i ];
     * 
     * for(; 0 <= i; --i){
     *   v = cb(v, array[i]);
     * }
     * return v;
     */
};
