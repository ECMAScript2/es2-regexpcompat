/** Types for regular expression flags.
 * @typedef {
 *   {
 *     global: boolean,
 *     ignoreCase: boolean,
 *     multiline: boolean,
 *     dotAll: (boolean|undefined),
 *     unicode: boolean,
 *     sticky: boolean
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
 *     names: Map<string, number>,
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

/**
 * Escapes raw character for showing.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-escaperegexppattern.
 * 
 * @param {string} raw 
 * @return {string}
 */
function escapeRaw( raw ){
    switch( raw ){
        case '\n':
            return '\\n';
        case '\r':
            return '\\r';
        case '\u2028':
            return '\\u2028';
        case '\u2029':
            return '\\u2029';
    };
    return raw;
};

/** Show class item as string.
 * 
 * @param {ClassItem} n 
 * @return {string|undefined}
 */
function classItemToString( n ){
    switch( n.type ){
        case REGEXP_COMPAT__PATTERN_IS_Char :
            return escapeRaw( /** @type {Char} */ (n).raw );
        // The above `switch-case` is exhaustive and it is checked by `tsc`, so `eslint` rule is disabled.
        // eslint-disable-next-line no-fallthrough
        case REGEXP_COMPAT__PATTERN_IS_ClassRange :
            return escapeRaw( /** @type {ClassRange} */ (n).children[ 0 ].raw ) + '-' + escapeRaw( /** @type {ClassRange} */ (n).children[ 1 ].raw );
        case REGEXP_COMPAT__PATTERN_IS_EscapeClass :
            switch( n.kind ){
                case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_digit :
                    return /** @type {SimpleEscapeClass} */ (n).invert ? '\\D' : '\\d';
                case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_word :
                    return /** @type {SimpleEscapeClass} */ (n).invert ? '\\W' : '\\w';
                case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_space :
                    return /** @type {SimpleEscapeClass} */ (n).invert ? '\\S' : '\\s';
                case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property :
                    if( DEFINE_REGEXP_COMPAT__ES2018 ){
                        return '\\' + ( /** @type {UnicodePropertyEscapeClass} */ (n).invert ? 'P' : 'p' ) + /** @type {UnicodePropertyEscapeClass} */ (n).property;
                    };
                case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property_value :
                    if( DEFINE_REGEXP_COMPAT__ES2018 ){
                        return '\\' + ( /** @type {UnicodePropertyValueEscapeClass} */ (n).invert ? 'P' : 'p' ) + /** @type {UnicodePropertyValueEscapeClass} */ (n).property + '=' + n.value;
                    };
            };
    };
};

nodeToString = function( n ){
    switch( n.type ){
        case REGEXP_COMPAT__PATTERN_IS_Disjunction :
            return Array_map( n.children, nodeToString ).join( '|' );
        case REGEXP_COMPAT__PATTERN_IS_Sequence :
            return Array_map( n.children, nodeToString ).join( '' );
        case REGEXP_COMPAT__PATTERN_IS_Capture :
            return '(' + nodeToString( n.child ) + ')';
        case REGEXP_COMPAT__PATTERN_IS_Group :
            return '(?:' + nodeToString( n.child ) + ')';
        case REGEXP_COMPAT__PATTERN_IS_Many :
            return nodeToString( n.child ) + '*' + ( n.nonGreedy ? '?' : '' );
        case REGEXP_COMPAT__PATTERN_IS_Some :
            return nodeToString( n.child ) + '+' + ( n.nonGreedy ? '?' : '' );
        case REGEXP_COMPAT__PATTERN_IS_Optional :
            return nodeToString( n.child ) + '?' + ( n.nonGreedy ? '?' : '' );
        case REGEXP_COMPAT__PATTERN_IS_Repeat :
            var s = nodeToString( n.child );
            s += '{' + n.min;
            if( n.max === Infinity ){
                s += ',';
            } else if( ( n.max !== null ? n.max : n.min ) != n.min ){
                s += ',' + n.max;
            };
            s += '}' + ( n.nonGreedy ? '?' : '' );
            return s;
        case REGEXP_COMPAT__PATTERN_IS_WordBoundary :
            return n.invert ? '\\B' : '\\b';
        case REGEXP_COMPAT__PATTERN_IS_LineBegin :
            return '^';
        case REGEXP_COMPAT__PATTERN_IS_LineEnd :
            return '$';
        case REGEXP_COMPAT__PATTERN_IS_LookAhead :
            return '(?' + ( n.negative ? '!' : '=' ) + nodeToString( n.child ) + ')';
        case REGEXP_COMPAT__PATTERN_IS_Char : {
            var c = escapeRaw( n.raw );
            return c === '/' ? '\\/' : c;
        };
        case REGEXP_COMPAT__PATTERN_IS_EscapeClass :
            return classItemToString( n );
        case REGEXP_COMPAT__PATTERN_IS_Class :
            return '[' + ( n.invert ? '^' : '' ) + Array_map( n.children, classItemToString ).join('') + ']';
        case REGEXP_COMPAT__PATTERN_IS_Dot :
            return '.';
        case REGEXP_COMPAT__PATTERN_IS_BackRef :
            return '\\' + n.index;
        case REGEXP_COMPAT__PATTERN_IS_NamedBackRef :
            return '\\k<' + n.raw + '>';
        case REGEXP_COMPAT__PATTERN_IS_NamedCapture :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return '(?<' + n.raw + '>' + nodeToString( n.child ) + ')';
            };
        case REGEXP_COMPAT__PATTERN_IS_LookBehind :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return '(?<' + ( n.negative ? '!' : '=' ) + nodeToString( n.child ) + ')';
            };
    };
};

/** Show flag set as string.
 *
 * @param {FlagSet} flagSet
 * @return {string}
 */
 flagSetToString = function( flagSet ){
    var s = '';

    if( flagSet.global ){
        s += 'g';
    };
    if( flagSet.ignoreCase ){
        s += 'i';
    };
    if( flagSet.multiline ){
        s += 'm';
    };
    if( flagSet.dotAll && DEFINE_REGEXP_COMPAT__ES2018 ){
        s += 's';
    };
    if( flagSet.unicode ){
        s += 'u';
    };
    if( flagSet.sticky ){
        s += 'y';
    };
    return s;
};

/** Show pattern as string.
 * 
 * @param {Pattern} p
 * @return {string}
 */
patternToString = function( p ){
    var s = '/';
    var n = nodeToString( p.child );

    s += n === '' ? '(?:)' : n;
    s += '/';
    s += flagSetToString( p.flagSet );
    return s;
};
