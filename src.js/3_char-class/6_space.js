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
