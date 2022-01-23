// THIS SCRIPT IS GENERATED BY "./tools.js/8_generateCharSetWordAndUnicodeWord.js". DO NOT EDIT!


// See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-characterclassescape.

/** A CharSet which contains ASCII digits. */
m_charSetDigit = new CharSet(
    [ 0x30, 0x39 + 1 ] // 0..9
);

/** A CharSet which does not contain ASCII digits. */
m_charSetInvertDigit = m_charSetDigit.clone().invert();

/** A CharSet which contains ASCII word characters. */
m_charSetWord = new CharSet( [ 48, 58, 65, 91, 95, 96, 97, 123 ] );

/** A CharSet which does not contain ASCII word characters. */
m_charSetInvertWord = m_charSetWord.clone().invert();

if( DEFINE_REGEXP_COMPAT__ES2018 ){
/**
 * A CharSet which contains Unicode word characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-wordcharacters-abstract-operation.
 */
    m_charSetUnicodeWord = new CharSet( [ 48, 58, 65, 91, 95, 96, 97, 123, 383, 384, 8490, 8491 ] );

/** A CharSet which does not contain Unicode word characters. */
    m_charSetInvertUnicodeWord = m_charSetUnicodeWord.clone().invert();
};

/**
 * A CharSet which contains space characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-WhiteSpace
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminator.
 */
m_charSetSpace = new CharSet( [ 9, 14, 32, 33, 160, 161, 5760, 5761, 8192, 8203, 8239, 8240, 8287, 8288, 12288, 12289, 65279, 65280 ] );

/** A CharSet which does not contain space characters. */
m_charSetInvertSpace = m_charSetSpace.clone().invert();