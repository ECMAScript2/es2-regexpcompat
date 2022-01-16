// See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-characterclassescape.

/** A `CharSet` which contains ASCII digits. */
var charSetDigit = new CharSet();
charSetDigit.add(0x30, 0x39 + 1); // 0..9

/** A `CharSet` which does not contain ASCII digits. */
var charSetInvertDigit = charSetDigit.clone().invert();

/** A `CharSet` which contains ASCII word characters. */
var charSetWord = new CharSet();
charSetWord.add(0x30, 0x39 + 1); // 0..9
charSetWord.add(0x41, 0x5a + 1); // A..Z
charSetWord.add(0x61, 0x7a + 1); // a..z
charSetWord.add(0x5f, 0x5f + 1); // _

/** A `CharSet` which does not contain ASCII word characters. */
var charSetInvertWord = charSetWord.clone().invert();

/**
 * A `CharSet` which contains Unicode word characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-wordcharacters-abstract-operation.
 */
var charSetUnicodeWord = charSetWord.clone();
for (const c of extraWordCharacters) {
  charSetUnicodeWord.add(c, c + 1);
}

/** A `CharSet` which does not contain Unicode word characters. */
var charSetInvertUnicodeWord = charSetUnicodeWord.clone().invert();

/**
 * A `CharSet` which contains space characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-WhiteSpace
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminator.
 */
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
var charSetSpace = new CharSet(category.get('Space_Separator'));
charSetSpace.add(0x09, 0x0d + 1); // <TAB>, <LF>, <VT>, <FF>, <CR>
charSetSpace.add(0xa0, 0xa0 + 1); // <NBSP>
charSetSpace.add(0xfeff, 0xfeff + 1); // <ZWNBSP>

/** A `CharSet` which does not contain space characters. */
var charSetInvertSpace = charSetSpace.clone().invert();
