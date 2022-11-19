/** Check the node is assertion, which means cannot become a child of repetition node.
 * 
 * @param {RegExpPaternNode} n 
 * @return {boolean} 
 */
function isAssertion( n ){
    // https://twitter.com/itozyun/status/1488876610077954051
    //   Closure Compiler が生成するラベル付き break が Opera 7.5x- で構文エラーになるので
    //   以下の通りに書き換えた
    if( DEFINE_REGEXP_COMPAT__MINIFY ){
        return REGEXP_COMPAT__PATTERN_IS_WordBoundary <= n.type &&
               n.type <= ( CONST_SUPPORT_ES2018 ? REGEXP_COMPAT__PATTERN_IS_LookBehind : REGEXP_COMPAT__PATTERN_IS_LookAhead );
    } else {
        switch( n.type ){
            case REGEXP_COMPAT__PATTERN_IS_WordBoundary :
            case REGEXP_COMPAT__PATTERN_IS_LineBegin :
            case REGEXP_COMPAT__PATTERN_IS_LineEnd :
            case REGEXP_COMPAT__PATTERN_IS_LookAhead :
                return true;
            case REGEXP_COMPAT__PATTERN_IS_LookBehind :
                if( CONST_SUPPORT_ES2018 ){
                    return true;
                };
        };
        return false;
    };
};

/** Check the character is sequence delimiter.
 * @param {string} c
 * @return {boolean}
 */
function isSequenceDelimiter( c ){
    return c === '|' || c === ')' || c === '';
};

/** Check the character is digit.
 * @param {string} c
 * @return {boolean}
 */
function isDigit( c ){
    return '0' <= c && c <= '9';
};

/** Check the character is hex digit.
 * @param {string} c
 * @return {boolean}
 */
function isHexDigit( c ){
    return isDigit( c ) || ( 'a' <= c && c <= 'f' ) || ( 'A' <= c && c <= 'F' );
};

/** Check the character has meaning in pattern.
 * @param {string} c
 * @return {boolean}
 */
function isSyntax( c ){
    return c !== '' && '^$\\.*+?()[]{}|'.indexOf( c ) !== -1;
};

/** Check the character can use for control escape.
 * @param {string} c
 * @return {boolean}
 */
function isControl( c ){
    return ( 'a' <= c && c <= 'z' ) || ( 'A' <= c && c <= 'Z' );
};

/** Check the character is part of Unicode property name.
 * @param {string} c
 * @return {boolean}
 */
function isUnicodeProperty( c ){
    return isControl( c ) || c === '_';
};

/** Check the character is part of Unicode property value.
 * @param {string} c
 * @return {boolean}
 */
function isUnicodePropertyValue( c ){
    return isUnicodeProperty( c ) || isDigit( c );
};

/** Check the character is identifier start character.
 * @param {string} c
 * @return {boolean}
 */
function isIDStart( c ){
    var cp;

    return c === '$' || c === '_' || charSetIdStart.has( ( cp = String_codePointAt( c, 0 ) ) !== undefined ? cp : -1 );
};

/** Check the character is identifier part character.
 * @param {string} c
 * @return {boolean}
 */
function isIDPart( c ){
    var cp;

    return c === '$' || c === '\u200C' || c === '\u200D' || charSetIdContinue.has( ( cp = String_codePointAt( c, 0 ) ) !== undefined ? cp : -1 );
};

/**
 * @param {!Array.<string|number>} captureGroupNames
 * @param {string} name
 * @return {number}
 */
m_getCaptureGroupIndexByName = function( captureGroupNames, name ){
    var index = captureGroupNames.indexOf( name );

    return index === -1 ? -1 : /** @type {number} */ (captureGroupNames[ index + 1 ]);
};

/** Type of repeat quantifier.
 * @typedef {{min: number, max: (number|null)}}
 */
var RepeatQuantifier;

/**
 * `Parser` is parser for regular expression pattern.
 *
 * This parses ECMA-262 `RegExp` pattern syntax.
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-patterns.
 *
 * Also, "Additional ECMAScript Features for Web Browsers" is supported if `additional` flag is `true` (default).
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-regular-expressions-patterns.
 *
 * @constructor
 * @param {string} source 
 * @param {string=} flags 
 * @param {boolean=} additional 
 */
Parser = function( source, flags, additional ){
     /** Precalculated number of capture group parens. */
    this.captureParens = 0;
    if( CONST_SUPPORT_ES2018 ){
        /** @type {(!Array<string|number>|undefined)} Associate from capture group name to its index. [ 'name1', index1, 'name2', index2, ... ] */
        this.names = [];
    };
    /** The current position of `source` string on parsing. */
    this.pos = 0;
    /** The current capture group parens index number. */
    this.captureParensIndex = 0;

    /** The source pattern string to parse. */
    this.source = source;
    /** The flags string. */
    this.flags = flags || '';
    /**
     * A flag whether support "Additional ECMAScript Features for Web Browsers" syntax.
     *
     * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-regular-expressions-patterns.
     */
    this.additional = additional !== false;
};
/** Run this parser.
 * @return {Pattern}
 */
Parser.prototype.parse = function(){
    /** @type {FlagSet} Parsed flags. */
    this.flagSet = Parser_preprocessFlags( this.flags );

    if( CONST_SUPPORT_ES2018 ){
        this.unicode = /** @type {boolean} Is the `flagSet` has `unicode`? */ (this.flagSet.unicode);
    };

    Parser_preprocessCaptures( this );

    this.pos = 0;
    var child = Parser_parseDisjunction( this );
    if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( this ) !== '' ){
        throw new RegExpSyntaxError( "too many ')'" );
    };

    if( CONST_SUPPORT_ES2018 ){
        return {
            type          : REGEXP_COMPAT__PATTERN_IS_Pattern,
            flagSet       : this.flagSet,
            captureParens : this.captureParens,
            names         : this.names,
            child         : child,
            range         : [ 0, this.pos ]
        };
    } else {
        return {
            type          : REGEXP_COMPAT__PATTERN_IS_Pattern,
            flagSet       : this.flagSet,
            captureParens : this.captureParens,
            child         : child,
            range         : [ 0, this.pos ]
        };
    };
};

/** Parse flags.
 * @param {string} flags
 * @return {FlagSet}
 */
function Parser_preprocessFlags( flags ){
    var flagSet;

    if( CONST_SUPPORT_ES2018 ){
        flagSet = {
            global     : false,
            ignoreCase : false,
            multiline  : false,
            unicode    : false,
            dotAll     : false,
            sticky     : false
        };
    } else {
        flagSet = {
            global     : false,
            ignoreCase : false,
            multiline  : false,
            // unicode    : false,
            // dotAll     : false,
            sticky     : false
        };
    };
    var l = flags.length;

    for( ; l; ){
        switch( flags.charAt( --l ) ){
            case 'g':
                if( flagSet.global && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError("duplicated 'g' flag");
                };
                flagSet.global = true;
                break;
            case 'i':
                if( flagSet.ignoreCase && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError("duplicated 'i' flag");
                };
                flagSet.ignoreCase = true;
                break;
            case 'm':
                if( flagSet.multiline && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError("duplicated 'm' flag");
                };
                flagSet.multiline = true;
                break;
            case 'y':
                // if( CONST_SUPPORT_ES2015 ){
                    if( flagSet.sticky && DEFINE_REGEXP_COMPAT__DEBUG ){
                        throw new RegExpSyntaxError("duplicated 'y' flag");
                    };
                    flagSet.sticky = true;
                // };
                break;
            case 's':
                if( CONST_SUPPORT_ES2018 ){
                    if( flagSet.dotAll && DEFINE_REGEXP_COMPAT__DEBUG ){
                        throw new RegExpSyntaxError("duplicated 's' flag");
                    };
                    flagSet.dotAll = true;
                };
                break;
            case 'u':
                if( CONST_SUPPORT_ES2018 ){
                    if( flagSet.unicode && DEFINE_REGEXP_COMPAT__DEBUG ){
                        throw new RegExpSyntaxError("duplicated 'u' flag");
                    };
                    flagSet.unicode = true;
                };
                break;
            default:
                if( DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('unknown flag');
                };
        };
    };
    return flagSet;
};

/**
 * Count number of capture group parens, and collect names.
 *
 * This process is needed before parsing because the syntax changes
 * its behavior when a pattern has named captrue.
 * 
 * @param {Parser} parser
 */
function Parser_preprocessCaptures( parser ){
    var len = parser.source.length,
        c, name, names, index;

    while( parser.pos < len ){
        c = Parser_current( parser );
        switch( c ){
            case '(' :
                if( CONST_SUPPORT_ES2018 && String_startsWith( parser.source, '(?<', parser.pos ) ){
                    parser.pos += 3; // skip '(?<'
                    c = Parser_current( parser );
                    if( c !== '=' && c !== '!' ){
                        ++parser.captureParens;
                        name  = Parser_parseCaptureName( parser );
                        names = parser.names;
                        index = names.indexOf( name );
                        if( index === -1 ){
                            names.push( name, parser.captureParens );
                        } else {
                            names[ index + 1 ] = parser.captureParens;
                        };
                    };
                } else {
                    if( !String_startsWith( parser.source, '(?', parser.pos ) ){
                        ++parser.captureParens;
                    };
                    ++parser.pos; // skip '('
                };
                break;
            case '\\':
                ++parser.pos; // skip '\\'
                parser.pos += Parser_current( parser ).length; // skip any character.
                break;
            case '[':
                Parser_skipCharClass( parser );
                break;
            default:
                parser.pos += c.length; // skip any character.
                break;
        };
    };
};

/** Skip character class without parsing.
 * @param {Parser} parser
 */
function Parser_skipCharClass( parser ){
    ++parser.pos; // skip '['
    while( parser.pos < parser.source.length ){
        var c = Parser_current( parser );
        switch( c ){
            case ']':
                ++parser.pos; // skip ']'
                return;
            case '\\':
                ++parser.pos; // skip '\\'
                parser.pos += Parser_current( parser ).length; // skip any character.
                break;
            default:
                parser.pos += c.length; // skip any character
                break;
        };
    };
};

/**
 * Parse `disjunction` pattern.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Disjunction.
 * 
 * @param {Parser} parser
 * @return {Disjunction}
 */
function Parser_parseDisjunction( parser ){
    var begin = parser.pos;
    var children = [ Parser_parseSequence( parser ) ];

    for( ; Parser_current( parser ) === '|'; ){
        ++parser.pos; // skip '|'
        children.push( Parser_parseSequence( parser ) );
    };

    if( children.length === 1 ){
        return children[ 0 ];
    };

    return { type : REGEXP_COMPAT__PATTERN_IS_Disjunction, children : children, range : [ begin, parser.pos ] };
};

/**
 * Parse `sequence` pattern.
 *
 * `sequence` is named `Alternative` in ECMA-262 specification.
 * However this naming is very confusing because
 * it does not make sence without the relation to `Disjunction`.
 * In formal language theory, `sequence` or `concatination` is better.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Alternative.
 *
 * @param {Parser} parser
 * @return {Sequence}
 */
function Parser_parseSequence( parser ){
    var begin = parser.pos;
    var children = [];

    for( ; !isSequenceDelimiter( Parser_current( parser ) ); ){
        children.push( Parser_parseQuantifier( parser ) );
    };

    if( children.length === 1 ){
        return children[ 0 ];
    };

    return { type: REGEXP_COMPAT__PATTERN_IS_Sequence, children : children, range: [ begin, parser.pos ] };
};

/**
 * Parse `quantifier` pattern.
 *
 * `quantifier` is one of `*`, `+`, `?` and `{n,m}` suffix operators,
 * and they can follow `?` for non-greedy matching.
 *
 * Note that ECMA-262 specification does not allow to quantify assertions like `/\b/`.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Quantifier,
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Term.
 *
 * @param {Parser} parser
 * @return {RegExpPaternNode}
 */
function Parser_parseQuantifier( parser ){
    var begin = parser.pos;
    var child = /** @type {RegExpPaternNode} */ (Parser_parseAtom( parser ));

    if( isAssertion( child ) ){
        if( parser.additional &&
            ( !CONST_SUPPORT_ES2018 || !parser.unicode ) &&
            child.type === REGEXP_COMPAT__PATTERN_IS_LookAhead
        ){} else {
            return child;
        };
    };

    switch( Parser_current( parser ) ){
        case '*':
            return Parser_parseSimpleQuantifier( parser, REGEXP_COMPAT__PATTERN_IS_Many, begin, child );
        case '+':
            return Parser_parseSimpleQuantifier( parser, REGEXP_COMPAT__PATTERN_IS_Some, begin, child );
        case '?':
            return Parser_parseSimpleQuantifier( parser, REGEXP_COMPAT__PATTERN_IS_Optional, begin, child );
        case '{':
            return Parser_parseRepeat( parser, begin, child );
    };

    return child;
};

/**
 * Parse simple quantifier suffix.
 *
 * Simple quantifier suffix means quantifiers execpt for `{n,m}`.
 * 
 * @param {Parser} parser
 * @param {string|number} type 
 * @param {number} begin 
 * @param {RegExpPaternNode} child 
 * @return {RegExpPaternNode}
 */
function Parser_parseSimpleQuantifier( parser, type, begin, child ){
    ++parser.pos; // skip one of '*', '+', '?'
    var nonGreedy = false;
    if( Parser_current( parser ) === '?' ){
        ++parser.pos; // skip '?'
        nonGreedy = true;
    };
    return /** @type {Many|Some|Optional} */ ({ type : type, nonGreedy : nonGreedy, child : child, range : [ begin, parser.pos ] });
};

/**
 * Parse repeat quantifier suffix (`{n}`, `{n,m}` or `{n,}`).
 *
 * When parsing is failed, however it is in `additional` mode,
 * it is retryable. And the real parsing is done by
 * `tryParseRepeatQuantifier` method.
 *
 * @param {Parser} parser
 * @param {number} begin
 * @param {RegExpPaternNode} child
 * @return {RegExpPaternNode}
 */
function Parser_parseRepeat( parser, begin, child ){
    var save = parser.pos;
    var quantifier = Parser_tryParseRepeatQuantifier( parser );

    if( !quantifier ){
        if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
            parser.pos = save;
            return child;
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('incomplete quantifier');
        };
    };

    var min = quantifier.min,
        max = quantifier.max;
    if( min > ( max !== null ? max : min ) && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('numbers out of order in quantifier');
    };

    var nonGreedy = false;
    if( Parser_current( parser ) === '?' ){
        ++parser.pos; // skip '?'
        nonGreedy = true;
    };

    return {
        type      : REGEXP_COMPAT__PATTERN_IS_Repeat,
        min       : min,
        max       : max,
        nonGreedy : nonGreedy,
        child     : child,
        range     : [ begin, parser.pos ]
    };
};

/**
 * Try to parse repeat quantifier.
 *
 * This method is separated from `parseRepeat` because
 * it is reused by `parseAtom` to detect "nothing to repeat" error
 * of repeat quantifier.
 *
 * When parsing is failed, it does not consume any character and return `null`.
 * 
 * @param {Parser} parser
 * @return {RepeatQuantifier|undefined}
 */
function Parser_tryParseRepeatQuantifier( parser ){
    var save = parser.pos;
    ++parser.pos; // skip '{'

    var min = Parser_parseDigits( parser );
    if( min < 0 ){
        parser.pos = save;
        return;
    };

    var max = null;
    if( Parser_current( parser ) === ',' ){
        ++parser.pos; // skip ','
        if( Parser_current( parser ) === '}' ){
            max = Infinity;
        } else {
            max = Parser_parseDigits( parser );
            if( max < 0 ){
                parser.pos = save;
                return;
            };
        };
    };

    if( Parser_current( parser ) !== '}' ){
        parser.pos = save;
        return;
    };
    ++parser.pos; // skip '}'

    return { min : min, max : max };
};

/**
 * Parse `atom` pattern.
 *
 * This method also parses `assertion` pattern.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Assertion,
 * and https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Atom.
 *
 * @param {Parser} parser
 * @return {RegExpPaternNode|undefined}
 */
function Parser_parseAtom( parser ){
    var begin = parser.pos;
    var c = Parser_current( parser );

    switch( c ){
        case '.':
            ++parser.pos; // skip '.'
            return { type: REGEXP_COMPAT__PATTERN_IS_Dot, range: [ begin, parser.pos ] };
        case '^':
            ++parser.pos; // skip '^'
            return { type: REGEXP_COMPAT__PATTERN_IS_LineBegin, range: [ begin, parser.pos ] };
        case '$':
            ++parser.pos; // skip '$'
            return { type: REGEXP_COMPAT__PATTERN_IS_LineEnd, range: [ begin, parser.pos ] };
        case '[':
            return Parser_parseClass( parser );
        case '\\':
            return Parser_parseEscape( parser );
        case '(':
            return Parser_parseParen( parser );
        case '*':
        case '+':
        case '?':
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('nothing to repeat');
            };
        case '{':
            if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
                if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_tryParseRepeatQuantifier( parser ) ){
                    throw new RegExpSyntaxError('nothing to repeat');
                };
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone quantifier brackets');
            };
        case '}':
            if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone quantifier brackets');
            };
        case ']':
            if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone character class brackets');
            };
        case ')':
        case '|':
        case '':
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                // Because this characters are handled by `parseSequence`.
                throw new Error('BUG: invalid character');
            };
    };

    // All cases are through, then it should be a simple source character.

    parser.pos += c.length; // skip any character
    var value = String_codePointAt( c, 0 );
    if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: invalid character');
    };
    return { type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : c, range : [ begin, parser.pos ] };
};

/** Parse `character class` pattern.
 * 
 * @param {Parser} parser
 * @return {RegExpPaternNode}
 */
function Parser_parseClass( parser ){
    var begin = parser.pos;
    ++parser.pos; // skip '['

    var invert = false;
    if( Parser_current( parser ) === '^' ){
        ++parser.pos; // skip '^'
        invert = true;
    };

    var children = [];

    for( ;; ){
        var c = Parser_current( parser );
        if( c === ']' ){
            break;
        };
        children.push( Parser_parseClassItem( parser ) );
    };
    ++parser.pos; // skip ']'

    return { type : REGEXP_COMPAT__PATTERN_IS_Class, invert : invert, children : children, range : [ begin, parser.pos ] };
};

/** Parse an item of `character class` pattern.
 * 
 * @param {Parser} parser
 * @return {ClassItem}
 */
function Parser_parseClassItem( parser ){
    var beginPos = parser.pos;

    var begin = Parser_parseClassAtom( parser );
    if( Parser_current( parser ) !== '-' ){
        return /** @type {Char|EscapeClass} */ (begin);
    };
    if( String_startsWith( parser.source, '-]', parser.pos ) ){
        return /** @type {Char|EscapeClass} */ (begin);
    };

    if( begin.type === REGEXP_COMPAT__PATTERN_IS_EscapeClass ){
        if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
            return /** @type {EscapeClass} */ (begin);
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError( 'invalid character class' );
        };
    };

    var save = parser.pos;
    ++parser.pos; // skip '-'
    var end = Parser_parseClassAtom( parser );
    if( end.type === REGEXP_COMPAT__PATTERN_IS_EscapeClass ){
        if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
            parser.pos = save;
            return begin;
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('invalid character class');
        };
    };

    if( begin.value > end.value && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('range out of order in character class');
    };

    return { type: REGEXP_COMPAT__PATTERN_IS_ClassRange, children : [ begin, end ], range: [ beginPos, parser.pos ] };
};

/** Parse an atom of `character class` range.
 * 
 * @param {Parser} parser
 * @return {Char|EscapeClass|undefined}
 */
function Parser_parseClassAtom( parser ){
    var begin = parser.pos;
    var c = Parser_current( parser );

    if( c === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('unterminated character class');
    };

    if( c !== '\\' ){
        parser.pos += c.length; // skip any character
        var value = String_codePointAt( c, 0 );
        if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid character');
        };
        return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : c, range : [ begin, parser.pos ] });
    };

    if( String_startsWith( parser.source, '\\-', parser.pos ) ){
        parser.pos += 2; // skip '\\-'
        return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0x2d, raw : '\\-', range : [ begin, parser.pos ] });
    };

    if( String_startsWith( parser.source, '\\b', parser.pos ) ){
        parser.pos += 2; // skip '\\b'
        return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0x08, raw : '\\b', range : [ begin, parser.pos ] });
    };

    var escapeClass = Parser_tryParseEscapeClass( parser );
    if( escapeClass ){
        return escapeClass;
    };

    var escape = Parser_tryParseEscape( parser );
    if( escape ){
        return escape;
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid escape');
    };
};

/**
 * Parse `escape sequence` pattern including `escape sequence character class`,
 * `back reference` and `word boundary assertion` patterns.
 * 
 * @param {Parser} parser
 * @return {RegExpPaternNode|undefined}
 */
function Parser_parseEscape( parser ){
    var wordBoundary = Parser_tryParseWordBoundary( parser );
    if( wordBoundary ){
        return wordBoundary;
    };

    var backRef = Parser_tryParseBackRef( parser );
    if( backRef ){
        return backRef;
    };

    var escapeClass = Parser_tryParseEscapeClass( parser );
    if( escapeClass ){
        return escapeClass;
    };

    var escape = Parser_tryParseEscape( parser );
    if( escape ){
        return escape;
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid escape');
    };
};

/** Try to parse `word boundary` pattern.
 * 
 * @param {Parser} parser
 * @return {WordBoundary|undefined}
 */
function Parser_tryParseWordBoundary( parser ){
    var begin = parser.pos;

    if( String_startsWith( parser.source, '\\b', parser.pos ) ){
        parser.pos += 2; // skip '\\b'
        return { type : REGEXP_COMPAT__PATTERN_IS_WordBoundary, invert : false, range : [ begin, parser.pos ] };
    };

    if( String_startsWith( parser.source, '\\B', parser.pos ) ){
        parser.pos += 2; // skip '\\B'
        return { type : REGEXP_COMPAT__PATTERN_IS_WordBoundary, invert : true, range : [ begin, parser.pos ] };
    };
};

/** Try to parse `back reference` pattern
 * 
 * @param {Parser} parser
 * @return {BackRef|NamedBackRef|undefined}
 */
function Parser_tryParseBackRef( parser ){
    var begin = parser.pos;
    ++parser.pos; // skip '\\';

    if( CONST_SUPPORT_ES2018 && 0 < parser.names.length ){
        if( Parser_current( parser ) === 'k' ){
            ++parser.pos; // skip 'k'
            if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== '<' ){
                throw new RegExpSyntaxError('invalid named back reference');
            };
            var namePos = ++parser.pos; // skip '<'
            var name = Parser_parseCaptureName( parser );
            return {
                type  : REGEXP_COMPAT__PATTERN_IS_NamedBackRef,
                name  : name,
                raw   : parser.source.slice( namePos, parser.pos - 1 ),
                range : [ begin, parser.pos ]
            };
        };
    };

    if( Parser_current( parser ) !== '0' ){
        var index = Parser_parseDigits( parser );
        if( index >= 1 ){
            if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
                if( index <= parser.captureParens ){
                    return { type: REGEXP_COMPAT__PATTERN_IS_BackRef, index : index, range : [ begin, parser.pos ] };
                };
            } else {
                return { type: REGEXP_COMPAT__PATTERN_IS_BackRef, index : index, range : [ begin, parser.pos ] };
            };
        };
    };

    parser.pos = begin;
};

/** Try to parse `escape sequence` pattern.
 * 
 * @param {Parser} parser
 * @return {Char|undefined}
 */
function Parser_tryParseEscape( parser ){
    var begin = parser.pos;
    var value, c;

    var unicode = Parser_tryParseUnicodeEscape( parser, true );
    if( unicode !== '' ){
        value = String_codePointAt( unicode, 0 );
        if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid character');
        };
        return /** @type {Char} */ ({
            type  : REGEXP_COMPAT__PATTERN_IS_Char,
            value : value,
            raw   : parser.source.slice( begin, parser.pos ),
            range : [ begin, parser.pos ]
        });
    };

    ++parser.pos; // skip '\\'
    switch( Parser_current( parser ) ){
        case 't':
            ++parser.pos; // skip 't'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x09, raw: '\\t', range: [ begin, parser.pos ] };
        case 'n':
            ++parser.pos; // skip 'n'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0a, raw: '\\n', range: [ begin, parser.pos ] };
        case 'v':
            ++parser.pos; // skip 'v'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0b, raw: '\\v', range: [ begin, parser.pos ] };
        case 'f':
            ++parser.pos; // skip 'f'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0c, raw: '\\f', range: [ begin, parser.pos ] };
        case 'r':
            ++parser.pos; // skip 'r'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0d, raw: '\\r', range: [ begin, parser.pos ] };
        case 'c': {
            ++parser.pos; // skip 'c'
            c = Parser_current( parser );
            value = 0;
            if( isControl( c ) ){
                ++parser.pos; // skip a-z or A-Z
                value = c.charCodeAt( 0 ) % 32;
            } else {
                if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
                    --parser.pos; // go back 'c'
                    break;
                };
                if( DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid control escape');
                };
            };
            return {
                type  : REGEXP_COMPAT__PATTERN_IS_Char,
                value : value,
                raw   : parser.source.slice( begin, parser.pos ),
                range : [ begin, parser.pos ]
            };
        }
        case 'x': {
            ++parser.pos; // skip 'x'
            value = Parser_tryParseHexDigitsN( parser, 2 );
            if( value < 0 ){
                --parser.pos; // go back 'x'
                break;
            };
            return {
                type  : REGEXP_COMPAT__PATTERN_IS_Char,
                value : value,
                raw   : parser.source.slice( begin, parser.pos ),
                range : [ begin, parser.pos ]
            };
        }
        case '0':
            ++parser.pos; // skip '0'
            if( isDigit( Parser_current( parser ) ) ){
                --parser.pos; // go back '0'
                break;
            };
            return { type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0, raw : '\\0', range : [ begin, parser.pos ] };
        case '':
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('\\ at end of pattern');
            };
    };

    // Legacy octal escape.
    if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
        var octal = parser.pos;
        var c0 = Parser_current( parser );
        if( '0' <= c0 && c0 <= '3' ){
            ++parser.pos;
            var c1 = Parser_current( parser );
            if( '0' <= c1 && c1 <= '7' ){
                ++parser.pos;
                var c2 = Parser_current( parser );
                if( '0' <= c2 && c2 <= '7' ){
                    ++parser.pos;
                };
            };
        } else if( '4' <= c0 && c0 <= '7' ){
            ++parser.pos;
            c1 = Parser_current( parser );
            if( '0' <= c1 && c1 <= '7' ){
                ++parser.pos;
            };
        };
        if( octal !== parser.pos ){
            value = /* Number. */ parseInt( parser.source.slice( octal, parser.pos ), 8 );
            return /** @type {Char} */ ({
                type  : REGEXP_COMPAT__PATTERN_IS_Char,
                value : value,
                raw   : parser.source.slice( begin, parser.pos ),
                range : [ begin, parser.pos ]
            });
        };
    };

    // Identity escape.
    c = Parser_current( parser );
    value = String_codePointAt( c, 0 );
    if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error( 'BUG: invalid character' );
    };
    if( CONST_SUPPORT_ES2018 && parser.unicode ){
        if( isSyntax( c ) || c === '/' ){
            parser.pos += c.length; // skip any char
            return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : '\\' + c, range : [ begin, parser.pos ] });
        };
    } else {
        if( parser.additional ){
            if( c === 'c' ){
                return { type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0x5c, raw : '\\', range : [ begin, parser.pos ] };
            };
            if( CONST_SUPPORT_ES2018 && parser.names.length === 0 || c !== 'k' ){
                parser.pos += c.length; // skip any char
                return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : '\\' + c, range : [ begin, parser.pos ] });
            };
        } else {
            if( !charSetIdContinue.has( value ) ){
                parser.pos += c.length; // skip any char
                return /** @type {Char} */ ({ type: REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw: '\\' + c, range : [ begin, parser.pos ] });
            };
        };
    };

    parser.pos = begin;
};

/**
 * Try to parse `\uXXXX` or `\u{XXXXXX}` escape sequence.
 *
 * This method is separated from `tryParseEscape` because
 * it is reused by `parseCaptureNameChar`.
 *
 * When it is failed, it returns `''`.
 *
 * @param {Parser} parser
 * @param {boolean} lead
 * @return {string}
 */
function Parser_tryParseUnicodeEscape( parser, lead ){
    var begin = parser.pos;
    var c;
    ++parser.pos; // skip '\\'

    if( Parser_current( parser ) !== 'u' ){
        parser.pos = begin;
        return '';
    };
    ++parser.pos; // skip 'u'

    if( CONST_SUPPORT_ES2018 && parser.unicode && Parser_current( parser ) === '{' ){
        if( !lead ){
            parser.pos = begin;
            return '';
        };
        ++parser.pos; // skip '{'
        c = Parser_parseHexDigits( parser );
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            if( c < 0 || 0x110000 <= c || Parser_current( parser ) !== '}' ){
                throw new RegExpSyntaxError('invalid Unicode escape');
            };
        };
        ++parser.pos; // skip '}'
        return String_fromCodePoint( c );
    };

    c = Parser_tryParseHexDigitsN( parser, 4 );
    if( c < 0 ){
        if( parser.additional && ( !CONST_SUPPORT_ES2018 || !parser.unicode ) ){
            parser.pos = begin;
            return '';
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('invalid Unicode escape');
        };
    };

    var s = String_fromCharCode( c );
    if( !CONST_SUPPORT_ES2018 || !parser.unicode ){
        return s;
    };

    if( lead && '\uD800' <= s && s <= '\uDBFF' && Parser_current( parser ) === '\\' ){
        var save = parser.pos;
        var t = Parser_tryParseUnicodeEscape( parser, false );
        if( '\uDC00' <= t && t <= '\uDFFF' ){
            return s + t;
        };
        parser.pos = save;
    };

    return s;
};

/** Try to parse `escape sequence character class` pattern.
 * 
 * @param {Parser} parser
 * @return {EscapeClass|undefined}
 */
function Parser_tryParseEscapeClass( parser ){
    var begin = parser.pos;
    ++parser.pos; // skip '\\'

    var c = Parser_current( parser );
    switch( c ){
        case 'd':
        case 'D':
            ++parser.pos; // skip 'd' or 'D'
            return { type: REGEXP_COMPAT__PATTERN_IS_EscapeClass, kind: REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_digit, invert: c === 'D', range: [ begin, parser.pos ] };
        case 'w':
        case 'W':
            ++parser.pos; // skip 'w' or 'W'
            return { type: REGEXP_COMPAT__PATTERN_IS_EscapeClass, kind: REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_word, invert: c === 'W', range: [ begin, parser.pos ] };
        case 's':
        case 'S':
            ++parser.pos; // skip 's' or 'S'
            return { type: REGEXP_COMPAT__PATTERN_IS_EscapeClass, kind: REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_space, invert: c === 'S', range: [ begin, parser.pos ] };
        case 'p':
        case 'P': {
            if( CONST_SUPPORT_ES2018 ){
                if( !parser.unicode ){
                    break;
                };
                var invert = c === 'P';
                ++parser.pos; // skip 'p' or 'P'

                if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== '{' ){
                    throw new RegExpSyntaxError('invalid Unicode property escape');
                };
                ++parser.pos; // skip '{'

                var property = Parser_parseUnicodePropertyName( parser );
                if( property === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid Unicode property name');
                };

                if( Parser_current( parser ) === '}' ){
                    ++parser.pos; // skip '}'
                    return {
                        type     : REGEXP_COMPAT__PATTERN_IS_EscapeClass,
                        kind     : REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property,
                        property : property,
                        invert   : invert,
                        range    : [ begin, parser.pos ]
                    };
                };

                if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== '=' ){
                    throw new RegExpSyntaxError('invalid Unicode property escape');
                };
                ++parser.pos; // skip '='

                var value = Parser_parseUnicodePropertyValue( parser );
                if( DEFINE_REGEXP_COMPAT__DEBUG && value === '' ){
                    throw new RegExpSyntaxError('invalid Unicode property value');
                };

                if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== '}' ){
                    throw new RegExpSyntaxError('invalid Unicode property escape');
                };
                ++parser.pos; // skip '}'

                return {
                    type     : REGEXP_COMPAT__PATTERN_IS_EscapeClass,
                    kind     : REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property_value,
                    property : property,
                    value    : value,
                    invert   : invert,
                    range    : [ begin, parser.pos ]
                };
            };
        };
    };

    parser.pos = begin;
};

/** Parse the first component of `\p{XXX=XXX}` escape sequence.
 * 
 * @param {Parser} parser
 * @return {string}
 */
function Parser_parseUnicodePropertyName( parser ){
    var p = '';

    for( var c; isUnicodeProperty( c = Parser_current( parser ) ); ){
        p += c;
        parser.pos += c.length; // skip any character
    };
    return p;
};

/** Parse the second component of `\p{XXX=XXX}` escape sequence.
 * 
 * @param {Parser} parser
 * @return {string}
 */
function Parser_parseUnicodePropertyValue( parser ){
    var v = '';

    for( var c; isUnicodePropertyValue( c = Parser_current( parser ) ); ){
        v += c;
        parser.pos += c.length; // skip any character
    };
    return v;
};

/** Parse grouping pattern by paren.
 * 
 * @param {Parser} parser
 * @return {Capture|Group|LookAhead|LookBehind|NamedCapture|undefined}
 */
function Parser_parseParen( parser ){
    var begin = parser.pos;
    var child, index;

    if( !String_startsWith( parser.source, '(?', parser.pos ) ){
        ++parser.pos; // skip '('
        index = ++parser.captureParensIndex;
        child = Parser_parseDisjunction( parser );
        if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
            throw new RegExpSyntaxError('unterminated capture');
        };
        ++parser.pos; // skip ')'
        return { type: REGEXP_COMPAT__PATTERN_IS_Capture, index : index, child : child, range : [ begin, parser.pos ] };
    };

    if( String_startsWith( parser.source, '(?:', parser.pos ) ){
        parser.pos += 3; // skip '(?:'
        child = Parser_parseDisjunction( parser );
        if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
            throw new RegExpSyntaxError('unterminated group');
        };
        ++parser.pos; // skip ')'
        return { type : REGEXP_COMPAT__PATTERN_IS_Group, child : child, range : [ begin, parser.pos ] };
    };

    if( String_startsWith( parser.source, '(?=', parser.pos ) ){
        parser.pos += 3; // skip '(?='
        child = Parser_parseDisjunction( parser );
        if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
            throw new RegExpSyntaxError('unterminated look-ahead');
        };
        ++parser.pos; // skip ')'
        return { type : REGEXP_COMPAT__PATTERN_IS_LookAhead, negative : false, child : child, range : [ begin, parser.pos ] };
    };

    if( String_startsWith( parser.source, '(?!', parser.pos ) ){
        parser.pos += 3; // skip '(?!'
        child = Parser_parseDisjunction( parser );
        if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
            throw new RegExpSyntaxError('unterminated look-ahead');
        };
        ++parser.pos; // skip ')'
        return { type : REGEXP_COMPAT__PATTERN_IS_LookAhead, negative : true, child : child, range : [ begin, parser.pos ] };
    };

    if( CONST_SUPPORT_ES2018 ){
        if( String_startsWith( parser.source, '(?<=', parser.pos ) ){
            parser.pos += 4; // skip '(?<='
            child = Parser_parseDisjunction( parser );
            if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
                throw new RegExpSyntaxError('unterminated look-behind');
            };
            ++parser.pos; // skip ')'
            return { type : REGEXP_COMPAT__PATTERN_IS_LookBehind, negative : false, child : child, range : [ begin, parser.pos ] };
        };

        if( String_startsWith( parser.source, '(?<!', parser.pos ) ){
            parser.pos += 4; // skip '(?<!'
            child = Parser_parseDisjunction( parser );
            if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
                throw new RegExpSyntaxError('unterminated look-behind');
            };
            ++parser.pos; // skip ')'
            return { type : REGEXP_COMPAT__PATTERN_IS_LookBehind, negative : true, child : child, range : [ begin, parser.pos ] };
        };

        if( String_startsWith( parser.source, '(?<', parser.pos ) ){
            index = ++parser.captureParensIndex;
            parser.pos += 3; // skip '(?<'
            var namePos = parser.pos;
            var name = Parser_parseCaptureName( parser );
            var raw = parser.source.slice( namePos, parser.pos - 1 );
            if( DEFINE_REGEXP_COMPAT__DEBUG && m_getCaptureGroupIndexByName( /** @type {!Array.<string|number>} */ (parser.names), name ) !== index ){
                throw new Error('BUG: invalid named capture');
            };
            child = Parser_parseDisjunction( parser );
            if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== ')' ){
                throw new RegExpSyntaxError('unterminated named capture');
            };
            ++parser.pos; // skip ')'
            return { type : REGEXP_COMPAT__PATTERN_IS_NamedCapture, name : name, raw : raw, child : child, range : [ begin, parser.pos ] };
        };
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid group');
    };
};

/**
 * Parse capture name.
 *
 * This method is used by `preprocessParens`, `tryParseBackRef` and `parseParen`.
 *
 * @param {Parser} parser
 * @return {string}
 */
function Parser_parseCaptureName( parser ){
    var name = '';
    var start = Parser_parseCaptureNameChar( parser );

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        if( !isIDStart( start ) ){
            throw new RegExpSyntaxError('invalid capture group name');
        };
    };
    name += start;

    for( ;; ){
        var save = parser.pos;
        var part = Parser_parseCaptureNameChar( parser );
        if( !isIDPart( part ) ){
            parser.pos = save;
            break;
        };
        name += part;
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG && Parser_current( parser ) !== '>' ){
        throw new RegExpSyntaxError('invalid capture group name');
    };
    ++parser.pos; // skip '>'

    return name;
};

/**
 * Parse capture name character.
 *
 * Unicode escape sequences are used as capture name character.
 *
 * @param {Parser} parser
 * @return {string}
 */
function Parser_parseCaptureNameChar( parser ){
    var c = Parser_current( parser );

    if( c === '\\' ){
        return Parser_tryParseUnicodeEscape( parser, true );
    };
    parser.pos += c.length; // skip any character
    return c;
};

/** Parse digits. If parsing is failed, return `-1`.
 *
 * @param {Parser} parser
 * @return {number}
 */
function Parser_parseDigits( parser ){
    var s = '', c;

    while( isDigit( c = Parser_current( parser ) ) ){
        s += c;
        ++parser.pos; // skip digit
    };
    return s === '' ? -1 : /* Number. */ + s; // <= parseInt( s, 10 )
};

/** Parse hex digits. If parsing is failed, return `-1`.
 *
 * @param {Parser} parser
 * @return {number}
 */
function Parser_parseHexDigits( parser ){
    var s = '', c;

    for( ; isHexDigit( c = Parser_current( parser ) ); ){
        s += c;
        parser.pos += c.length; // skip hex digit
    };
    return s === '' ? -1 : /* Number. */ parseInt( s, 16 );
};

/** Try to parse `n` characters of hex digits.  If parsing is faield, return `-1`.
 *
 * @param {Parser} parser
 * @param {number} n
 * @return {number}
 */
function Parser_tryParseHexDigitsN( parser, n ){
    var save = parser.pos;
    var s = '';
    while( n-- > 0 ){
        var c = Parser_current( parser );
        if( !isHexDigit( c ) ){
            parser.pos = save;
            return -1;
        };
        s += c;
        parser.pos += c.length; // skip hex digit
    };
    return /* Number. */ parseInt( s, 16 );
};

/** Return the current character.
 * 
 * @param {Parser} parser
 * @return {string}
 */
function Parser_current( parser ){
    var c;

    if( CONST_SUPPORT_ES2018 && parser.unicode ){
        c = String_codePointAt( parser.source, parser.pos );
        return c === undefined ? '' : String_fromCodePoint( c );
    };
    c = parser.source.charCodeAt( parser.pos );
    return /* Number.isNaN( c ) */ c !== c ? '' : String_fromCharCode( c );
};

if( DEFINE_REGEXP_COMPAT__NODEJS ){
    module[ 'exports' ][ 'Parser' ] = Parser;
};