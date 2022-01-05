/**
 * オリジナルから、引数を一つに変更
 * original:
 *   https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/string.polyfill.js#L39
 * @param {number} codePoint 
 * @return {string}
 */
function String_fromCodePoint( codePoint ){
    var highSurrogate;
    var lowSurrogate;
    var result;

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        if(
            !isFinite( codePoint ) ||
            codePoint < 0 ||
            codePoint > 0x10ffff ||
            Math_floor( codePoint ) != codePoint
        ){
            throw RangeError( 'Invalid code point: ' + codePoint );
        };
    };

    if( codePoint <= 0xffff ){
        // BMP code point
        result = String_stringFromCharCode( codePoint );
    } else {
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xd800;
        lowSurrogate  = (codePoint % 0x400) + 0xdc00;
        result = String_stringFromCharCode( highSurrogate ) + String_stringFromCharCode( lowSurrogate );
    };
    return result;
};

/**
 * original:
 *   https://github.com/behnammodi/polyfill/blob/1a5965edc0e2eaf8e6d87902cc719462e2a889fb/string.polyfill.js#L291
 *
 * @param {string} str
 * @param {number} targetLength
 * @return {string}
 */
function String_padStringWithZero( str, targetLength ){
    // targetLength = targetLength >> 0; //floor if number or convert non-number to 0;

    if( targetLength <= str.length ){
        return str;
    } else {
        return ( '0000' + str ).substr( 4 - targetLength + str.length );
    };
};

/**
 * @param {Array} array
 * @return {Array}
 */
function Array_from( array ){
    var l = array.length,
        result = [];

    while( l ){
        result[ --l ] = array[ l ];
    };
    return result;
};
