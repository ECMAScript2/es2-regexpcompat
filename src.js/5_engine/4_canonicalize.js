/** Return case-folded code point for ignore-case comparison.
 *
 * @param {number} c
 * @param {boolean} unicode
 * @return {number} 
 */
canonicalize = function( c, unicode ){
    if( unicode ){
        return foldMap.get( c ) || c;
    };

    var s = String_fromCharCode( c );
    var u = s.toUpperCase();
    if( u.length >= 2 ){
        return c;
    };
    var d = u.charCodeAt( 0 );
    if( c >= 0x80 && d < 0x80 ){
        return c;
    };
    return d;
};

/**
 * Inverse function of `canonicalize`.
 *
 * It is used for character class matching on ignore-case.
 *
 * @param {number} c
 * @param {boolean} unicode
 * @return {Array.<number>} 
 */
uncanonicalize = function( c, unicode ){
    if( unicode ){
        return inverseFoldMap$1.get( c ) || [];
    };

    var d = inverseFoldMap.get( c );
    if( d !== undefined ){
        return d;
    };
    var s = String_fromCharCode( c );
    return [ s.toLowerCase().charCodeAt( 0 ) ];
};
