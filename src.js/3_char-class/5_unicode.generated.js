/**
 * A `CharSet` which contains Unicode word characters.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-wordcharacters-abstract-operation.
 */
var charSetUnicodeWord = charSetWord.clone();
for (const c of extraWordCharacters) {
  charSetUnicodeWord.add(c, c + 1);
}
console.log( 'charSetUnicodeWord:' + charSetUnicodeWord.data );

/** A `CharSet` which does not contain Unicode word characters. */
var charSetInvertUnicodeWord = charSetUnicodeWord.clone().invert();
