/** Return case-folded code point for ignore-case comparison.
 *
 * @param {number} c
 * @param {boolean|undefined} unicode
 * @return {number} 
 */
canonicalize = function( c, unicode ){
    if( DEFINE_REGEXP_COMPAT__ES2018 && unicode ){
        return m_unicodeFoldMap[ c ] || c;
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
 * @param {boolean|undefined} unicode
 * @return {Array.<number>} 
 */
uncanonicalize = function( c, unicode ){
    if( DEFINE_REGEXP_COMPAT__ES2018 && unicode ){
        return m_unicodeInverseFoldMap[ c ] || [];
    };

    var d = m_legacyFoldMap[ c ];
    if( d ){
        return d;
    };
    var s = String_fromCharCode( c );
    return [ s.toLowerCase().charCodeAt( 0 ) ];
};
