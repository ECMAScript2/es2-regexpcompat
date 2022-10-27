module.exports = function(){
    const hex    = require( './0_util.js' ).hex;
    const common /* : Map<number, number> */ = require('unicode-12.0.0/Case_Folding/C/code-points.js');
    const simple /* : Map<number, number> */ = require('unicode-12.0.0/Case_Folding/S/code-points.js');

    // Merge C and S mappings.
    const foldMap = new Map()/* <number, number> */;
    for( const [ c, d ] of common ){
        foldMap.set( c, d );
    };
    for( const [ c, d ] of simple ){
        // assert(!foldMap.has(c));
        foldMap.set( c, d );
    };

    // Generate output data.
    let src =
`CONST_SUPPORT_ES2018 && (function( caseFoldingCodePoints ){
    var i = -1, codePoint0, codePoint1;

    for( ; codePoint0 = caseFoldingCodePoints[ ++i ]; ){
        codePoint1 = caseFoldingCodePoints[ ++i ];
        m_unicodeFoldMap[ codePoint0 ] = codePoint1;

        if( !m_unicodeInverseFoldMap[ codePoint1 ] ){
            m_unicodeInverseFoldMap[ codePoint1 ] = [];
        };
        m_unicodeInverseFoldMap[ codePoint1 ].push( codePoint0 );
    };
})( [
`;
    for( const [ c, d ] of foldMap ){
        src += '    ' + hex( c ) + ', ' + hex( d ) + ',\n';
    };
    return src.substring( 0, src.length - 2 ) + '\n] );';
};
