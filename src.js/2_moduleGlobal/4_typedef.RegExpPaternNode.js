/** Types for regular expression flags.
 * @typedef {
 *   {
 *     global: boolean,
 *     ignoreCase: boolean,
 *     multiline: boolean,
 *     sticky: (boolean|undefined),
 *     dotAll: (boolean|undefined),
 *     unicode: (boolean|undefined)
 *   }
 * }
*/
var FlagSet;

/** Type for whole regular expression pattern.
 * @typedef {
 *   {
 *     type: (string|number),
 *     flagSet: FlagSet,
 *     captureParens: number,
 *     names: (!Array.<string,number>|undefined),
 *     child: RegExpPaternNode,
 *     range: Array.<number>
 *   }
 * }
 */
var Pattern;

/** Type for part of regular expression pattern.
 * @typedef {Disjunction|Sequence|Capture|NamedCapture|Group|Many|Some|Optional|Repeat|WordBoundary|LineBegin|LineEnd|LookAhead|LookBehind|Char|EscapeClass|Class|Dot|BackRef|NamedBackRef}
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
 *   type: (string|number),
 *   children: Array.<RegExpPaternNode>,
 *   range: Array.<number>
 * }}
 */
var Disjunction;

/** Type for sequence pattern `/(ab)/`.
 * @typedef {{
 *   type: (string|number),
 *   children: Array.<RegExpPaternNode>,
 *   range: Array.<number>
 * }}
 */
var Sequence;

/** Type for capture group `/(...)/`.
 * @typedef {{
 *   type: (string|number),
 *   index: number,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var Capture;

/** Type for named capture group `/(?<x>...)/`.
 * @typedef {{
 *   type: (string|number),
 *   name: string,
 *   raw: string,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var NamedCapture;

/** Type for non-capture group `/(?:...)/`.
 * @typedef {{
 *   type: (string|number),
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var Group;

/** Type for zero-or-more repetition pattern `/(a*)/`.
 * @typedef {{
 *   type: (string|number),
 *   nonGreedy: boolean,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var Many;

/** Type for one-or-more repetition pattern `/(a+)/`.
 * @typedef {{
 *   type: (string|number),
 *   nonGreedy: boolean,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var Some;

/** Type for skippable pattern `/(a?)/`.
 * @typedef {{
 *   type: (string|number),
 *   nonGreedy: boolean,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var Optional;

/** Type for general repetition pattern `/(a{10,20})/`.
 * @typedef {{
 *   type: (string|number),
 *   min: number,
 *   max: (number|null),
 *   nonGreedy: boolean,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var Repeat;

/** Type for word boundary assertion pattern `/(\b)/`.
 * @typedef {{
 *   type: (string|number),
 *   invert: boolean,
 *   range: Array.<number>
 * }}
 */
var WordBoundary;

/** Type for line begin assertion pattern `/(^)/`.
 * @typedef {{
 *   type: (string|number),
 *   range: Array.<number>
 * }}
 */
var LineBegin;

/** Type for line end assertion pattern `/($)/`.
 * @typedef {{
 *   type: (string|number),
 *   range: Array.<number>
 * }}
 */
var LineEnd;

/** Type for look-ahead assertion `/(?=a)/`.
 * @typedef {{
 *   type: (string|number),
 *   negative: boolean,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var LookAhead;

/** Type for look-behind assertion `/(?<=a)/`.
 * @typedef {{
 *   type: (string|number),
 *   negative: boolean,
 *   child: RegExpPaternNode,
 *   range: Array.<number>
 * }}
 */
var LookBehind;

/** Type for character pattern `/a/`.
 * @typedef {{
 *   type: (string|number),
 *   value: number,
 *   raw: string,
 *   range: Array.<number>
 * }}
 */
var Char;

/** Type for escape sequence class like `/\w/`.
 * @typedef {
 *    SimpleEscapeClass| UnicodePropertyEscapeClass| UnicodePropertyValueEscapeClass
 * }
 */
var EscapeClass;

/** Type for simple escape sequence class like `/\d/`.
 * kind = 'digit' | 'word' | 'space';
 * 
 * @typedef {{
 *   type: (string|number),
 *   kind: (string|number),
 *   invert: boolean,
 *   range: Array.<number>
 * }}
 */
var SimpleEscapeClass;

/** Type for unicode property escape sequence class like `\p{Zs}`.
 * kind = 'unicode_property';
 * 
 * @typedef {{
 *   type: (string|number),
 *   kind: (string|number),
 *   invert: boolean,
 *   property: string,
 *   range: Array.<number>
 * }}
 */
var UnicodePropertyEscapeClass;

/** Type for unicode property value escape sequence class like `\p{Script=Hira}`.
 * kind = 'unicode_property_value';
 * 
 * @typedef {{
 *   type: (string|number),
 *   kind: (string|number),
 *   invert: boolean,
 *   property: string,
 *   value: string,
 *   range: Array.<number>
 * }}
 */
var UnicodePropertyValueEscapeClass;

/** Type for character class pattern `/[a-z]/`.
 * 
 * @typedef {{
 *   type: (string|number),
 *   invert: boolean,
 *   children: Array.<ClassItem>,
 *   range: Array.<number>
 * }}
 */
var Class;

/** Type for character range in class pattern.
 *
 * @typedef {{
 *   type: (string|number),
 *   children: Array.<Char>,
 *   range: Array.<number>
 * }}
 */
var ClassRange;

/** Type for any character pattern `/./`.
 *
 * @typedef {{
 *   type: (string|number),
 *   range: Array.<number>
 * }}
 */
var Dot;

/** Type for back reference pattern `/\1/`.
 *
 * @typedef {{
 *   type: (string|number),
 *   index: number,
 *   range: Array.<number>
 * }}
 */
var BackRef;

/** Type for named back reference pattern `/\k<x>/`.
 *
 * @typedef {{
 *   type: (string|number),
 *   name: string,
 *   raw: string,
 *   range: Array.<number>
 * }}
 */
var NamedBackRef;
