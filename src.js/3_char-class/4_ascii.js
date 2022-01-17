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
