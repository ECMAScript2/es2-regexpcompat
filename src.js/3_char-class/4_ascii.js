// See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-characterclassescape.

/** A `CharSet` which contains ASCII digits. */
const digit = new CharSet();
digit.add(0x30, 0x39 + 1); // 0..9

/** A `CharSet` which does not contain ASCII digits. */
const invertDigit = digit.clone().invert();

/** A `CharSet` which contains ASCII word characters. */
const word = new CharSet();
word.add(0x30, 0x39 + 1); // 0..9
word.add(0x41, 0x5a + 1); // A..Z
word.add(0x61, 0x7a + 1); // a..z
word.add(0x5f, 0x5f + 1); // _

/** A `CharSet` which does not contain ASCII word characters. */
const invertWord = word.clone().invert();

/**
 * A `CharSet` which contains Unicode word characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-wordcharacters-abstract-operation.
 */
const unicodeWord = word.clone();
for (const c of extraWordCharacters) {
  unicodeWord.add(c, c + 1);
}

/** A `CharSet` which does not contain Unicode word characters. */
const invertUnicodeWord = unicodeWord.clone().invert();

/**
 * A `CharSet` which contains space characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-WhiteSpace
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-LineTerminator.
 */
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const space = new CharSet(category.get('Space_Separator'));
space.add(0x09, 0x0d + 1); // <TAB>, <LF>, <VT>, <FF>, <CR>
space.add(0xa0, 0xa0 + 1); // <NBSP>
space.add(0xfeff, 0xfeff + 1); // <ZWNBSP>

/** A `CharSet` which does not contain space characters. */
const invertSpace = space.clone().invert();
