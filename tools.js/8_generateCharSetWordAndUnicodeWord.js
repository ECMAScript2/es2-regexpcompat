module.exports = function(){
    const common /* : Map<number, number> */ = require('unicode-12.0.0/Case_Folding/C/code-points.js');
    const simple /* : Map<number, number> */ = require('unicode-12.0.0/Case_Folding/S/code-points.js');
    const spaceSeparatorCodePoints /* : number[] */ = require( 'unicode-12.0.0/General_Category/Space_Separator/code-points.js' );
    const CharSet = require( './0_util.js' ).CharSet;

    // Merge C and S mappings.
    const foldMap = new Map()/* <number, number> */;
    for( const [ c, d ] of common ){
        foldMap.set( c, d );
    };
    for( const [ c, d ] of simple ){
        // assert(!foldMap.has(c));
        foldMap.set( c, d );
    };

    const charSetWord = new CharSet();
    charSetWord.add(0x30, 0x39 + 1); // 0..9
    charSetWord.add(0x41, 0x5a + 1); // A..Z
    charSetWord.add(0x61, 0x7a + 1); // a..z
    charSetWord.add(0x5f, 0x5f + 1); // _


    const wordCharacters = new Set(
        Array.from( 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_' ).map( ( c ) =>
            c.charCodeAt( 0 )
        )
    );
  
    // Calculate `extraWordCharacters`.
    const extraWordCharacters = [];
    for( const [ c, d ] of foldMap ){
        if( !wordCharacters.has( c ) && wordCharacters.has( d ) ){
            extraWordCharacters.push( c );
        };
    };

    const charSetUnicodeWord = charSetWord.clone();
    for( const c of extraWordCharacters ){
        charSetUnicodeWord.add( c, c + 1 );
    };

    const charSetSpace = new CharSet();
    for( const c of spaceSeparatorCodePoints ){
        charSetSpace.add( c, c + 1 );
    };
    charSetSpace.add( 0x09, 0x0d + 1 ); // <TAB>, <LF>, <VT>, <FF>, <CR>
    charSetSpace.add( 0xa0, 0xa0 + 1 ); // <NBSP>
    charSetSpace.add( 0xfeff, 0xfeff + 1 ); // <ZWNBSP>

    // Generate output data.
    return `
// See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-characterclassescape.

/** A CharSet which contains ASCII digits. */
m_charSetDigit = m_createCharSetFromArray(
    [ 0x30, 0x39 + 1 ] // 0..9
);

/** A CharSet which does not contain ASCII digits. */
m_charSetInvertDigit = m_charSetDigit.clone().invert();

/** A CharSet which contains ASCII word characters. */
m_charSetWord = m_createCharSetFromArray( [ ${charSetWord.data.join( ', ' )} ] );

/** A CharSet which does not contain ASCII word characters. */
m_charSetInvertWord = m_charSetWord.clone().invert();

if( CONST_SUPPORT_ES2018 ){
/**
 * A CharSet which contains Unicode word characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-wordcharacters-abstract-operation.
 */
    m_charSetUnicodeWord = m_createCharSetFromArray( [ ${charSetUnicodeWord.data.join( ', ' )} ] );

/** A CharSet which does not contain Unicode word characters. */
    m_charSetInvertUnicodeWord = m_charSetUnicodeWord.clone().invert();
};

/**
 * A CharSet which contains space characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-WhiteSpace
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminator.
 */
m_charSetSpace = m_createCharSetFromArray( [ ${charSetSpace.data.join( ', ' )} ] );

/** A CharSet which does not contain space characters. */
m_charSetInvertSpace = m_charSetSpace.clone().invert();
`;
};
