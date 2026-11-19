
goog.provide( 'vm.EnumPattern' );
goog.provide( 'vm.EnumKind' );
goog.provide( 'vm.d.FlagSet' );

goog.require( 'vm.DEFINE.MINIFY' );

/**
 * @enum {number | string} */
vm.EnumPattern = {
    Pattern      : vm.DEFINE.MINIFY ?  0 : 'Pattern',
    Disjunction  : vm.DEFINE.MINIFY ?  1 : 'Disjunction',
    Sequence     : vm.DEFINE.MINIFY ?  2 : 'Sequence',
    Capture      : vm.DEFINE.MINIFY ?  3 : 'Capture',
    NamedCapture : vm.DEFINE.MINIFY ?  4 : 'NamedCapture',
    Group        : vm.DEFINE.MINIFY ?  5 : 'Group',
    Many         : vm.DEFINE.MINIFY ?  6 : 'Many',
    Some         : vm.DEFINE.MINIFY ?  7 : 'Some',
    Optional     : vm.DEFINE.MINIFY ?  8 : 'Optional',
    Repeat       : vm.DEFINE.MINIFY ?  9 : 'Repeat',
    WordBoundary : vm.DEFINE.MINIFY ? 10 : 'WordBoundary',
    LineBegin    : vm.DEFINE.MINIFY ? 11 : 'LineBegin',
    LineEnd      : vm.DEFINE.MINIFY ? 12 : 'LineEnd',
    LookAhead    : vm.DEFINE.MINIFY ? 13 : 'LookAhead',
    LookBehind   : vm.DEFINE.MINIFY ? 14 : 'LookBehind',
    Char         : vm.DEFINE.MINIFY ? 15 : 'Char',
    EscapeClass  : vm.DEFINE.MINIFY ? 16 : 'EscapeClass',
    Class        : vm.DEFINE.MINIFY ? 17 : 'Class',
    ClassRange   : vm.DEFINE.MINIFY ? 18 : 'ClassRange',
    Dot          : vm.DEFINE.MINIFY ? 19 : 'Dot',
    BackRef      : vm.DEFINE.MINIFY ? 20 : 'BackRef',
    NamedBackRef : vm.DEFINE.MINIFY ? 21 : 'NamedBackRef'
};

/**
 * @enum {number | string} */
vm.EnumKind = {
    digit                  : vm.DEFINE.MINIFY ?  1 : 'digit',
    word                   : vm.DEFINE.MINIFY ?  2 : 'word',
    space                  : vm.DEFINE.MINIFY ?  3 : 'space',
    unicode_property       : vm.DEFINE.MINIFY ?  4 : 'unicode_property',
    unicode_property_value : vm.DEFINE.MINIFY ?  5 : 'unicode_property_value'
};

/** Types for regular expression flags.
 * @typedef {
 *   {
 *     global     : boolean,
 *     ignoreCase : boolean,
 *     multiline  : boolean,
 *     sticky     : (boolean|void),
 *     dotAll     : (boolean|void),
 *     unicode    : (boolean|void)
 *   }
 * }
*/
vm.d.FlagSet;

/** Type for whole regular expression pattern.
 * @typedef {
 *   {
 *     type          : vm.EnumPattern,
 *     flagSet       : !vm.d.FlagSet,
 *     captureParens : number,
 *     names         : (!Array.<string | number> | void),
 *     child         : RegExpPaternNode,
 *     range         : !Array.<number>
 *   }
 * }
 */
var Pattern;

/** Type for part of regular expression pattern.
 * @typedef {
 *     Disjunction|Sequence|Capture|
 *     NamedCapture|Group|Many|
 *     Some|Optional|Repeat|
 *     WordBoundary|LineBegin|LineEnd|
 *     LookAhead|LookBehind|Char|EscapeClass|
 *     Class|Dot|BackRef|NamedBackRef
 * }
 */
var RegExpPaternNode;

/** Type for items of character class.
 * @typedef {Char | EscapeClass | ClassRange}
 */
var ClassItem;

/** Type for AST elements.
 * @typedef {Pattern | RegExpPaternNode | ClassItem}
 */
var ASTElement;

/** Type for select pattern `/(a|b)/`.
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   children : !Array.<!RegExpPaternNode>,
 *   range    : !Array.<number>
 * }}
 */
var Disjunction;

/** Type for sequence pattern `/(ab)/`.
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   children : !Array.<!RegExpPaternNode>,
 *   range    : !Array.<number>
 * }}
 */
var Sequence;

/** Type for capture group `/(...)/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   index : number,
 *   child : !RegExpPaternNode,
 *   range : !Array.<number>
 * }}
 */
var Capture;

/** Type for named capture group `/(?<x>...)/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   name  : string,
 *   raw   : string,
 *   child : !RegExpPaternNode,
 *   range : !Array.<number>
 * }}
 */
var NamedCapture;

/** Type for non-capture group `/(?:...)/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   child : !RegExpPaternNode,
 *   range : !Array.<number>
 * }}
 */
var Group;

/** Type for zero-or-more repetition pattern `/(a*)/`.
 * @typedef {{
 *   type      : vm.EnumPattern,
 *   nonGreedy : boolean,
 *   child     : !RegExpPaternNode,
 *   range     : !Array.<number>
 * }}
 */
var Many;

/** Type for one-or-more repetition pattern `/(a+)/`.
 * @typedef {{
 *   type      : vm.EnumPattern,
 *   nonGreedy : boolean,
 *   child     : !RegExpPaternNode,
 *   range     : !Array.<number>
 * }}
 */
var Some;

/** Type for skippable pattern `/(a?)/`.
 * @typedef {{
 *   type      : vm.EnumPattern,
 *   nonGreedy : boolean,
 *   child     : !RegExpPaternNode,
 *   range     : !Array.<number>
 * }}
 */
var Optional;

/** Type for general repetition pattern `/(a{10,20})/`.
 * @typedef {{
 *   type      : vm.EnumPattern,
 *   min       : number,
 *   max       : (number|null),
 *   nonGreedy : boolean,
 *   child     : !RegExpPaternNode,
 *   range     : !Array.<number>
 * }}
 */
var Repeat;

/** Type for word boundary assertion pattern `/(\b)/`.
 * @typedef {{
 *   type   : vm.EnumPattern,
 *   invert : boolean,
 *   range  : !Array.<number>
 * }}
 */
var WordBoundary;

/** Type for line begin assertion pattern `/(^)/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   range : !Array.<number>
 * }}
 */
var LineBegin;

/** Type for line end assertion pattern `/($)/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   range : !Array.<number>
 * }}
 */
var LineEnd;

/** Type for look-ahead assertion `/(?=a)/`.
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   negative : boolean,
 *   child    : !RegExpPaternNode,
 *   range    : !Array.<number>
 * }}
 */
var LookAhead;

/** Type for look-behind assertion `/(?<=a)/`.
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   negative : boolean,
 *   child    : !RegExpPaternNode,
 *   range    : !Array.<number>
 * }}
 */
var LookBehind;

/** Type for character pattern `/a/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   value : number,
 *   raw   : string,
 *   range : !Array.<number>
 * }}
 */
var Char;

/** Type for escape sequence class like `/\w/`.
 * @typedef {
 *     SimpleEscapeClass| UnicodePropertyEscapeClass| UnicodePropertyValueEscapeClass
 * }
 */
var EscapeClass;

/** Type for simple escape sequence class like `/\d/`.
 * kind = 'digit' | 'word' | 'space';
 * @typedef {{
 *   type   : vm.EnumPattern,
 *   kind   : vm.EnumKind,
 *   invert : boolean,
 *   range  : !Array.<number>
 * }}
 */
var SimpleEscapeClass;

/** Type for unicode property escape sequence class like `\p{Zs}`.
 * kind = 'unicode_property';
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   kind     : vm.EnumKind,
 *   invert   : boolean,
 *   property : string,
 *   range    : !Array.<number>
 * }}
 */
var UnicodePropertyEscapeClass;

/** Type for unicode property value escape sequence class like `\p{Script=Hira}`.
 * kind = 'unicode_property_value';
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   kind     : vm.EnumKind,
 *   invert   : boolean,
 *   property : string,
 *   value    : string,
 *   range    : !Array.<number>
 * }}
 */
var UnicodePropertyValueEscapeClass;

/** Type for character class pattern `/[a-z]/`.
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   invert   : boolean,
 *   children : !Array.<ClassItem>,
 *   range    : !Array.<number>
 * }}
 */
var Class;

/** Type for character range in class pattern.
 * @typedef {{
 *   type     : vm.EnumPattern,
 *   children : !Array.<Char>,
 *   range    : !Array.<number>
 * }}
 */
var ClassRange;

/** Type for any character pattern `/./`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   range : !Array.<number>
 * }}
 */
var Dot;

/** Type for back reference pattern `/\1/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   index : number,
 *   range : !Array.<number>
 * }}
 */
var BackRef;

/** Type for named back reference pattern `/\k<x>/`.
 * @typedef {{
 *   type  : vm.EnumPattern,
 *   name  : string,
 *   raw   : string,
 *   range : !Array.<number>
 * }}
 */
var NamedBackRef;
