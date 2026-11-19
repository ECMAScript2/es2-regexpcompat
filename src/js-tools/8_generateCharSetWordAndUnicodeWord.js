module.exports = function( path ){
    const common /* : Map<number, number> */        = require('unicode-12.0.0/Case_Folding/C/code-points.js');
    const simple /* : Map<number, number> */        = require('unicode-12.0.0/Case_Folding/S/code-points.js');
    const spaceSeparatorCodePoints /* : number[] */ = require( 'unicode-12.0.0/General_Category/Space_Separator/code-points.js' );
    const CharSet                                   = require( path ).CharSet;

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

goog.provide( 'vm.charSet.Digit' );
goog.provide( 'vm.charSet.InvertDigit' );
goog.provide( 'vm.charSet.Word' );
goog.provide( 'vm.charSet.InvertWord' );
goog.provide( 'vm.charSet.UnicodeWord' );
goog.provide( 'vm.charSet.InvertUnicodeWord' );
goog.provide( 'vm.charSet.Space' );
goog.provide( 'vm.charSet.InvertSpace' );

goog.requireType( 'vm.d.CharSet' );
goog.require( 'vm.createCharSet' );
goog.require( 'vm.SUPPORT_ES2018' );

/** A CharSet which contains ASCII digits. 
 * @const {!vm.d.CharSet} */
vm.charSet.Digit = vm.createCharSet(
    [ 0x30, 0x39 + 1 ] // 0..9
);

/** A CharSet which does not contain ASCII digits.
 * @const {!vm.d.CharSet} */
vm.charSet.InvertDigit = vm.charSet.Digit.clone().invert();

/** A CharSet which contains ASCII word characters.
 * @const {!vm.d.CharSet} */
vm.charSet.Word = vm.createCharSet( [ ${charSetWord.data.join( ', ' )} ] );

/** A CharSet which does not contain ASCII word characters.
 * @const {!vm.d.CharSet} */
vm.charSet.InvertWord = vm.charSet.Word.clone().invert();

if( vm.SUPPORT_ES2018 ){
    /**
     * A CharSet which contains Unicode word characters.
     *
     * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-wordcharacters-abstract-operation.
     * 
     * @const {!vm.d.CharSet} */
    vm.charSet.UnicodeWord = vm.createCharSet( [ ${charSetUnicodeWord.data.join( ', ' )} ] );

    /** A CharSet which does not contain Unicode word characters.
     * @const {!vm.d.CharSet} */
    vm.charSet.InvertUnicodeWord = vm.charSet.UnicodeWord.clone().invert();
};

/**
 * A CharSet which contains space characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-WhiteSpace
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminator.
 * @const {!vm.d.CharSet} */
vm.charSet.Space = vm.createCharSet( [ ${charSetSpace.data.join( ', ' )} ] );

/** A CharSet which does not contain space characters.
 * @const {!vm.d.CharSet} */
vm.charSet.InvertSpace = vm.charSet.Space.clone().invert();
`;
};
