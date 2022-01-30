/** Check the node is assertion, which means cannot become a child of repetition node.
 * 
 * @param {RegExpPaternNode} n 
 * @return {boolean} 
 */
function isAssertion( n ){
    switch( n.type ){
        case REGEXP_COMPAT__PATTERN_IS_WordBoundary :
        case REGEXP_COMPAT__PATTERN_IS_LineBegin :
        case REGEXP_COMPAT__PATTERN_IS_LineEnd :
        case REGEXP_COMPAT__PATTERN_IS_LookAhead :
            return true;
        case REGEXP_COMPAT__PATTERN_IS_LookBehind :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return true;
            };
    };
    return false;
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
    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        /** @type {Object<string, number>} Precalculated `Map` associate from capture group name to its index. */
        this.names = { _size : 0 };
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
    this.flagSet = this.preprocessFlags();

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        this.unicode = /** @type {boolean} Is the `flagSet` has `unicode`? */ (this.flagSet.unicode);
    };

    this.preprocessCaptures();

    this.pos = 0;
    var child = this.parseDisjunction();
    if( this.current() !== '' && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError( "too many ')'" );
    };

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
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
 * @return {FlagSet}
 */
Parser.prototype.preprocessFlags = function(){
    var flagSet;

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
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
    var l = this.flags.length;

    for( ; l; ){
        switch( this.flags.charAt( --l ) ){
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
                if( flagSet.sticky && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError("duplicated 's' flag");
                };
                flagSet.sticky = true;
                break;
            case 's':
                if( DEFINE_REGEXP_COMPAT__ES2018 ){
                    if( flagSet.dotAll && DEFINE_REGEXP_COMPAT__DEBUG ){
                        throw new RegExpSyntaxError("duplicated 's' flag");
                    };
                    flagSet.dotAll = true;
                };
                break;
            case 'u':
                if( DEFINE_REGEXP_COMPAT__ES2018 ){
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
 */
Parser.prototype.preprocessCaptures = function(){
    var len = this.source.length;

    while( this.pos < len ){
        var c = this.current();
        switch( c ){
            case '(' :
                if( DEFINE_REGEXP_COMPAT__ES2018 && String_startsWith( this.source, '(?<', this.pos ) ){
                    this.pos += 3; // skip '(?<'
                    var d = this.current();
                    if( d !== '=' && d !== '!' ){
                        ++this.captureParens;
                        var name = this.parseCaptureName();
                        if( !this.names[ name ] ){
                            ++this.names._size;
                        };
                        this.names[ name ] = this.captureParens;
                    };
                } else {
                    if( !String_startsWith( this.source, '(?', this.pos ) ){
                        ++this.captureParens;
                    };
                    ++this.pos; // skip '('
                };
                break;
            case '\\':
                ++this.pos; // skip '\\'
                this.pos += this.current().length; // skip any character.
                break;
            case '[':
                this.skipCharClass();
                break;
            default:
                this.pos += c.length; // skip any character.
                break;
        };
    };
};

/** Skip character class without parsing. */
Parser.prototype.skipCharClass = function(){
    ++this.pos; // skip '['
    while( this.pos < this.source.length ){
        var c = this.current();
        switch( c ){
            case ']':
                ++this.pos; // skip ']'
                return;
            case '\\':
                ++this.pos; // skip '\\'
                this.pos += this.current().length; // skip any character.
                break;
            default:
                this.pos += c.length; // skip any character
                break;
        };
    };
};

/**
 * Parse `disjunction` pattern.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#prod-Disjunction.
 * 
 * @return {Disjunction}
 */
Parser.prototype.parseDisjunction = function(){
    var begin = this.pos;
    var children = [ this.parseSequence() ];

    for( ; this.current() === '|'; ){
        ++this.pos; // skip '|'
        children.push( this.parseSequence() );
    };

    if( children.length === 1 ){
        return children[ 0 ];
    };

    return { type : REGEXP_COMPAT__PATTERN_IS_Disjunction, children : children, range : [ begin, this.pos ] };
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
 * @return {Sequence}
 */
Parser.prototype.parseSequence = function(){
    var begin = this.pos;
    var children = [];

    for( ; !isSequenceDelimiter( this.current() ); ){
        children.push( this.parseQuantifier() );
    };

    if( children.length === 1 ){
        return children[ 0 ];
    };

    return { type: REGEXP_COMPAT__PATTERN_IS_Sequence, children : children, range: [ begin, this.pos ] };
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
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseQuantifier = function(){
    var begin = this.pos;
    var child = /** @type {RegExpPaternNode} */ ( this.parseAtom() );

    if( isAssertion( child ) ){
        if( this.additional &&
            ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) &&
            child.type === REGEXP_COMPAT__PATTERN_IS_LookAhead
        ){} else {
            return child;
        };
    };

    switch( this.current() ){
        case '*':
            return this.parseSimpleQuantifier( REGEXP_COMPAT__PATTERN_IS_Many, begin, child );
        case '+':
            return this.parseSimpleQuantifier( REGEXP_COMPAT__PATTERN_IS_Some, begin, child );
        case '?':
            return this.parseSimpleQuantifier( REGEXP_COMPAT__PATTERN_IS_Optional, begin, child );
        case '{':
            return this.parseRepeat( begin, child );
    };

    return child;
};

/**
 * Parse simple quantifier suffix.
 *
 * Simple quantifier suffix means quantifiers execpt for `{n,m}`.
 * 
 * @param {string|number} type 
 * @param {number} begin 
 * @param {RegExpPaternNode} child 
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseSimpleQuantifier = function( type, begin, child ){
    ++this.pos; // skip one of '*', '+', '?'
    var nonGreedy = false;
    if( this.current() === '?' ){
        ++this.pos; // skip '?'
        nonGreedy = true;
    };
    return /** @type {Many|Some|Optional} */ ({ type : type, nonGreedy : nonGreedy, child : child, range : [ begin, this.pos ] });
};

/**
 * Parse repeat quantifier suffix (`{n}`, `{n,m}` or `{n,}`).
 *
 * When parsing is failed, however it is in `additional` mode,
 * it is retryable. And the real parsing is done by
 * `tryParseRepeatQuantifier` method.
 *
 * @param {number} begin
 * @param {RegExpPaternNode} child
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseRepeat = function( begin, child ){
    var save = this.pos;
    var quantifier = this.tryParseRepeatQuantifier();

    if( !quantifier ){
        if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
            this.pos = save;
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
    if( this.current() === '?' ){
        ++this.pos; // skip '?'
        nonGreedy = true;
    };

    return {
        type      : REGEXP_COMPAT__PATTERN_IS_Repeat,
        min       : min,
        max       : max,
        nonGreedy : nonGreedy,
        child     : child,
        range     : [ begin, this.pos ]
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
 * @return {RepeatQuantifier|undefined}
 */
Parser.prototype.tryParseRepeatQuantifier = function(){
    var save = this.pos;
    ++this.pos; // skip '{'

    var min = this.parseDigits();
    if( min < 0 ){
        this.pos = save;
        return;
    };

    var max = null;
    if( this.current() === ',' ){
        ++this.pos; // skip ','
        if( this.current() === '}' ){
            max = Infinity;
        } else {
            max = this.parseDigits();
            if( max < 0 ){
                this.pos = save;
                return;
            };
        };
    };

    if( this.current() !== '}' ){
        this.pos = save;
        return;
    };
    ++this.pos; // skip '}'

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
 * @return {RegExpPaternNode|undefined}
 */
Parser.prototype.parseAtom = function(){
    var begin = this.pos;
    var c = this.current();

    switch( c ){
        case '.':
            ++this.pos; // skip '.'
            return { type: REGEXP_COMPAT__PATTERN_IS_Dot, range: [ begin, this.pos ] };
        case '^':
            ++this.pos; // skip '^'
            return { type: REGEXP_COMPAT__PATTERN_IS_LineBegin, range: [ begin, this.pos ] };
        case '$':
            ++this.pos; // skip '$'
            return { type: REGEXP_COMPAT__PATTERN_IS_LineEnd, range: [ begin, this.pos ] };
        case '[':
            return this.parseClass();
        case '\\':
            return this.parseEscape();
        case '(':
            return this.parseParen();
        case '*':
        case '+':
        case '?':
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('nothing to repeat');
            };
        case '{':
            if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
                var quantifier = this.tryParseRepeatQuantifier();
                if( quantifier && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('nothing to repeat');
                };
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone quantifier brackets');
            };
        case '}':
            if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone quantifier brackets');
            };
        case ']':
            if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
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

    this.pos += c.length; // skip any character
    var value = String_codePointAt( c, 0 );
    if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: invalid character');
    };
    return { type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : c, range : [ begin, this.pos ] };
};

/** Parse `character class` pattern.
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseClass = function(){
    var begin = this.pos;
    ++this.pos; // skip '['

    var invert = false;
    if( this.current() === '^' ){
        ++this.pos; // skip '^'
        invert = true;
    };

    var children = [];

    for( ;; ){
        var c = this.current();
        if( c === ']' ){
            break;
        };
        children.push( this.parseClassItem() );
    };
    ++this.pos; // skip ']'

    return { type : REGEXP_COMPAT__PATTERN_IS_Class, invert : invert, children : children, range : [ begin, this.pos ] };
};

/** Parse an item of `character class` pattern.
 * @return {ClassItem}
 */
Parser.prototype.parseClassItem = function(){
    var beginPos = this.pos;

    var begin = this.parseClassAtom();
    if( this.current() !== '-' ){
        return /** @type {Char|EscapeClass} */ (begin);
    };
    if( String_startsWith( this.source, '-]', this.pos ) ){
        return /** @type {Char|EscapeClass} */ (begin);
    };

    if( begin.type === REGEXP_COMPAT__PATTERN_IS_EscapeClass ){
        if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
            return /** @type {EscapeClass} */ (begin);
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError( 'invalid character class' );
        };
    };

    var save = this.pos;
    ++this.pos; // skip '-'
    var end = this.parseClassAtom();
    if( end.type === REGEXP_COMPAT__PATTERN_IS_EscapeClass ){
        if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
            this.pos = save;
            return begin;
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('invalid character class');
        };
    };

    if( begin.value > end.value && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('range out of order in character class');
    };

    return { type: REGEXP_COMPAT__PATTERN_IS_ClassRange, children : [ begin, end ], range: [ beginPos, this.pos ] };
};

/** Parse an atom of `character class` range.
 * @return {Char|EscapeClass|undefined}
 */
Parser.prototype.parseClassAtom = function(){
    var begin = this.pos;
    var c = this.current();

    if( c === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('unterminated character class');
    };

    if( c !== '\\' ){
        this.pos += c.length; // skip any character
        var value = String_codePointAt( c, 0 );
        if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid character');
        };
        return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : c, range : [ begin, this.pos ] });
    };

    if( String_startsWith( this.source, '\\-', this.pos ) ){
        this.pos += 2; // skip '\\-'
        return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0x2d, raw : '\\-', range : [ begin, this.pos ] });
    };

    if( String_startsWith( this.source, '\\b', this.pos ) ){
        this.pos += 2; // skip '\\b'
        return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0x08, raw : '\\b', range : [ begin, this.pos ] });
    };

    var escapeClass = this.tryParseEscapeClass();
    if( escapeClass ){
        return escapeClass;
    };

    var escape = this.tryParseEscape();
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
 * @return {RegExpPaternNode|undefined}
 */
Parser.prototype.parseEscape = function(){
    var wordBoundary = this.tryParseWordBoundary();
    if( wordBoundary ){
        return wordBoundary;
    };

    var backRef = this.tryParseBackRef();
    if( backRef ){
        return backRef;
    };

    var escapeClass = this.tryParseEscapeClass();
    if( escapeClass ){
        return escapeClass;
    };

    var escape = this.tryParseEscape();
    if( escape ){
        return escape;
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid escape');
    };
};

/** Try to parse `word boundary` pattern.
 * @return {WordBoundary|undefined}
 */
Parser.prototype.tryParseWordBoundary = function(){
    var begin = this.pos;

    if( String_startsWith( this.source, '\\b', this.pos ) ){
        this.pos += 2; // skip '\\b'
        return { type : REGEXP_COMPAT__PATTERN_IS_WordBoundary, invert : false, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '\\B', this.pos ) ){
        this.pos += 2; // skip '\\B'
        return { type : REGEXP_COMPAT__PATTERN_IS_WordBoundary, invert : true, range : [ begin, this.pos ] };
    };
};

/** Try to parse `back reference` pattern
 * @return {BackRef|NamedBackRef|undefined}
 */
Parser.prototype.tryParseBackRef = function(){
    var begin = this.pos;
    ++this.pos; // skip '\\';

    if( DEFINE_REGEXP_COMPAT__ES2018 && this.names._size > 0 ){
        if( this.current() === 'k' ){
            ++this.pos; // skip 'k'
            if( this.current() !== '<' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid named back reference');
            };
            var namePos = ++this.pos; // skip '<'
            var name = this.parseCaptureName();
            return {
                type  : REGEXP_COMPAT__PATTERN_IS_NamedBackRef,
                name  : name,
                raw   : this.source.slice( namePos, this.pos - 1 ),
                range : [ begin, this.pos ]
            };
        };
    };

    if( this.current() !== '0' ){
        var index = this.parseDigits();
        if( index >= 1 ){
            if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
                if( index <= this.captureParens ){
                    return { type: REGEXP_COMPAT__PATTERN_IS_BackRef, index : index, range : [ begin, this.pos ] };
                };
            } else {
                return { type: REGEXP_COMPAT__PATTERN_IS_BackRef, index : index, range : [ begin, this.pos ] };
            };
        };
    };

    this.pos = begin;
};

/** Try to parse `escape sequence` pattern.
 * @return {Char|undefined}
 */
Parser.prototype.tryParseEscape = function(){
    var begin = this.pos;
    var value, c;

    var unicode = this.tryParseUnicodeEscape( true );
    if( unicode !== '' ){
        value = String_codePointAt( unicode, 0 );
        if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid character');
        };
        return /** @type {Char} */ ({
            type  : REGEXP_COMPAT__PATTERN_IS_Char,
            value : value,
            raw   : this.source.slice( begin, this.pos ),
            range : [ begin, this.pos ]
        });
    };

    ++this.pos; // skip '\\'
    switch( this.current() ){
        case 't':
            ++this.pos; // skip 't'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x09, raw: '\\t', range: [ begin, this.pos ] };
        case 'n':
            ++this.pos; // skip 'n'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0a, raw: '\\n', range: [ begin, this.pos ] };
        case 'v':
            ++this.pos; // skip 'v'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0b, raw: '\\v', range: [ begin, this.pos ] };
        case 'f':
            ++this.pos; // skip 'f'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0c, raw: '\\f', range: [ begin, this.pos ] };
        case 'r':
            ++this.pos; // skip 'r'
            return { type: REGEXP_COMPAT__PATTERN_IS_Char, value: 0x0d, raw: '\\r', range: [ begin, this.pos ] };
        case 'c': {
            ++this.pos; // skip 'c'
            c = this.current();
            value = 0;
            if( isControl( c ) ){
                ++this.pos; // skip a-z or A-Z
                value = c.charCodeAt( 0 ) % 32;
            } else {
                if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
                    --this.pos; // go back 'c'
                    break;
                };
                if( DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid control escape');
                };
            };
            return {
                type  : REGEXP_COMPAT__PATTERN_IS_Char,
                value : value,
                raw   : this.source.slice( begin, this.pos ),
                range : [ begin, this.pos ]
            };
        }
        case 'x': {
            ++this.pos; // skip 'x'
            value = this.tryParseHexDigitsN( 2 );
            if( value < 0 ){
                --this.pos; // go back 'x'
                break;
            };
            return {
                type  : REGEXP_COMPAT__PATTERN_IS_Char,
                value : value,
                raw   : this.source.slice( begin, this.pos ),
                range : [ begin, this.pos ]
            };
        }
        case '0': {
            ++this.pos; // skip '0'
            if( isDigit( this.current() ) ){
                --this.pos; // go back '0'
                break;
            };
            return { type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0, raw : '\\0', range : [ begin, this.pos ] };
        };
        case '':
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('\\ at end of pattern');
            };
    };

    // Legacy octal escape.
    if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
        var octal = this.pos;
        var c0 = this.current();
        if( '0' <= c0 && c0 <= '3' ){
            ++this.pos;
            var c1 = this.current();
            if( '0' <= c1 && c1 <= '7' ){
                ++this.pos;
                var c2 = this.current();
                if( '0' <= c2 && c2 <= '7' ){
                    ++this.pos;
                };
            };
        } else if( '4' <= c0 && c0 <= '7' ){
            ++this.pos;
            c1 = this.current();
            if( '0' <= c1 && c1 <= '7' ){
                ++this.pos;
            };
        };
        if( octal !== this.pos ){
            value = /* Number. */ parseInt( this.source.slice( octal, this.pos ), 8 );
            return /** @type {Char} */ ({
                type  : REGEXP_COMPAT__PATTERN_IS_Char,
                value : value,
                raw   : this.source.slice( begin, this.pos ),
                range : [ begin, this.pos ]
            });
        };
    };

    // Identity escape.
    c = this.current();
    value = String_codePointAt( c, 0 );
    if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error( 'BUG: invalid character' );
    };
    if( DEFINE_REGEXP_COMPAT__ES2018 && this.unicode ){
        if( isSyntax( c ) || c === '/' ){
            this.pos += c.length; // skip any char
            return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : '\\' + c, range : [ begin, this.pos ] });
        };
    } else {
        if( this.additional ){
            if( c === 'c' ){
                return { type : REGEXP_COMPAT__PATTERN_IS_Char, value : 0x5c, raw : '\\', range : [ begin, this.pos ] };
            };
            if( DEFINE_REGEXP_COMPAT__ES2018 && this.names._size === 0 || c !== 'k' ){
                this.pos += c.length; // skip any char
                return /** @type {Char} */ ({ type : REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw : '\\' + c, range : [ begin, this.pos ] });
            };
        } else {
            if( !charSetIdContinue.has( value ) ){
                this.pos += c.length; // skip any char
                return /** @type {Char} */ ({ type: REGEXP_COMPAT__PATTERN_IS_Char, value : value, raw: '\\' + c, range : [ begin, this.pos ] });
            };
        };
    };

    this.pos = begin;
};

/**
 * Try to parse `\uXXXX` or `\u{XXXXXX}` escape sequence.
 *
 * This method is separated from `tryParseEscape` because
 * it is reused by `parseCaptureNameChar`.
 *
 * When it is failed, it returns `''`.
 *
 * @param {boolean} lead
 * @return {string}
 */
Parser.prototype.tryParseUnicodeEscape = function( lead ){
    var begin = this.pos;
    var c;
    ++this.pos; // skip '\\'

    if( this.current() !== 'u' ){
        this.pos = begin;
        return '';
    };
    ++this.pos; // skip 'u'

    if( DEFINE_REGEXP_COMPAT__ES2018 && this.unicode && this.current() === '{' ){
        if( !lead ){
            this.pos = begin;
            return '';
        };
        ++this.pos; // skip '{'
        c = this.parseHexDigits();
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            if( c < 0 || 0x110000 <= c || this.current() !== '}' ){
                throw new RegExpSyntaxError('invalid Unicode escape');
            };
        };
        ++this.pos; // skip '}'
        return String_fromCodePoint( c );
    };

    c = this.tryParseHexDigitsN( 4 );
    if( c < 0 ){
        if( this.additional && ( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ) ){
            this.pos = begin;
            return '';
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('invalid Unicode escape');
        };
    };

    var s = String_fromCharCode( c );
    if( !DEFINE_REGEXP_COMPAT__ES2018 || !this.unicode ){
        return s;
    };

    if( lead && '\uD800' <= s && s <= '\uDBFF' && this.current() === '\\' ){
        var save = this.pos;
        var t = this.tryParseUnicodeEscape( false );
        if( '\uDC00' <= t && t <= '\uDFFF' ){
            return s + t;
        };
        this.pos = save;
    };

    return s;
};

/** Try to parse `escape sequence character class` pattern.
 * @return {EscapeClass|undefined}
 */
Parser.prototype.tryParseEscapeClass = function(){
    var begin = this.pos;
    ++this.pos; // skip '\\'

    var c = this.current();
    switch( c ){
        case 'd':
        case 'D':
            ++this.pos; // skip 'd' or 'D'
            return { type: REGEXP_COMPAT__PATTERN_IS_EscapeClass, kind: REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_digit, invert: c === 'D', range: [ begin, this.pos ] };
        case 'w':
        case 'W':
            ++this.pos; // skip 'w' or 'W'
            return { type: REGEXP_COMPAT__PATTERN_IS_EscapeClass, kind: REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_word, invert: c === 'W', range: [ begin, this.pos ] };
        case 's':
        case 'S':
            ++this.pos; // skip 's' or 'S'
            return { type: REGEXP_COMPAT__PATTERN_IS_EscapeClass, kind: REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_space, invert: c === 'S', range: [ begin, this.pos ] };
        case 'p':
        case 'P': {
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                if( !this.unicode ){
                    break;
                };
                var invert = c === 'P';
                ++this.pos; // skip 'p' or 'P'

                if( this.current() !== '{' && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid Unicode property escape');
                };
                ++this.pos; // skip '{'

                var property = this.parseUnicodePropertyName();
                if( property === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid Unicode property name');
                };

                if( this.current() === '}' ){
                    ++this.pos; // skip '}'
                    return {
                        type     : REGEXP_COMPAT__PATTERN_IS_EscapeClass,
                        kind     : REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property,
                        property : property,
                        invert   : invert,
                        range    : [ begin, this.pos ]
                    };
                };

                if( this.current() !== '=' && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid Unicode property escape');
                };
                ++this.pos; // skip '='

                var value = this.parseUnicodePropertyValue();
                if( value === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid Unicode property value');
                };

                if( this.current() !== '}' && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid Unicode property escape');
                };
                ++this.pos; // skip '}'

                return {
                    type     : REGEXP_COMPAT__PATTERN_IS_EscapeClass,
                    kind     : REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property_value,
                    property : property,
                    value    : value,
                    invert   : invert,
                    range    : [ begin, this.pos ]
                };
            };
        };
    };

    this.pos = begin;
};

/** Parse the first component of `\p{XXX=XXX}` escape sequence.
 * @return {string}
 */
Parser.prototype.parseUnicodePropertyName = function(){
    var p = '';

    for( var c; isUnicodeProperty( c = this.current() ); ){
        p += c;
        this.pos += c.length; // skip any character
    };
    return p;
};

/** Parse the second component of `\p{XXX=XXX}` escape sequence.
 * @return {string}
 */
Parser.prototype.parseUnicodePropertyValue = function(){
    var v = '';

    for( var c; isUnicodePropertyValue( c = this.current() ); ){
        v += c;
        this.pos += c.length; // skip any character
    };
    return v;
};

/** Parse grouping pattern by paren.
 * @return {Capture|Group|LookAhead|LookBehind|NamedCapture|undefined}
 */
Parser.prototype.parseParen = function(){
    var begin = this.pos;
    var child, index;

    if( !String_startsWith( this.source, '(?', this.pos ) ){
        ++this.pos; // skip '('
        index = ++this.captureParensIndex;
        child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated capture');
        };
        ++this.pos; // skip ')'
        return { type: REGEXP_COMPAT__PATTERN_IS_Capture, index : index, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?:', this.pos ) ){
        this.pos += 3; // skip '(?:'
        child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated group');
        };
        ++this.pos; // skip ')'
        return { type : REGEXP_COMPAT__PATTERN_IS_Group, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?=', this.pos ) ){
        this.pos += 3; // skip '(?='
        child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated look-ahead');
        };
        ++this.pos; // skip ')'
        return { type : REGEXP_COMPAT__PATTERN_IS_LookAhead, negative : false, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?!', this.pos ) ){
        this.pos += 3; // skip '(?!'
        child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated look-ahead');
        };
        ++this.pos; // skip ')'
        return { type : REGEXP_COMPAT__PATTERN_IS_LookAhead, negative : true, child : child, range : [ begin, this.pos ] };
    };

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        if( String_startsWith( this.source, '(?<=', this.pos ) ){
            this.pos += 4; // skip '(?<='
            child = this.parseDisjunction();
            if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('unterminated look-behind');
            };
            ++this.pos; // skip ')'
            return { type : REGEXP_COMPAT__PATTERN_IS_LookBehind, negative : false, child : child, range : [ begin, this.pos ] };
        };

        if( String_startsWith( this.source, '(?<!', this.pos ) ){
            this.pos += 4; // skip '(?<!'
            child = this.parseDisjunction();
            if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('unterminated look-behind');
            };
            ++this.pos; // skip ')'
            return { type : REGEXP_COMPAT__PATTERN_IS_LookBehind, negative : true, child : child, range : [ begin, this.pos ] };
        };

        if( String_startsWith( this.source, '(?<', this.pos ) ){
            index = ++this.captureParensIndex;
            this.pos += 3; // skip '(?<'
            var namePos = this.pos;
            var name = this.parseCaptureName();
            var raw = this.source.slice( namePos, this.pos - 1 );
            if( this.names[ name ] !== index && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new Error('BUG: invalid named capture');
            };
            child = this.parseDisjunction();
            if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('unterminated named capture');
            };
            ++this.pos; // skip ')'
            return { type : REGEXP_COMPAT__PATTERN_IS_NamedCapture, name : name, raw : raw, child : child, range : [ begin, this.pos ] };
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
 * @return {string}
 */
Parser.prototype.parseCaptureName = function(){
    var name = '';
    var start = this.parseCaptureNameChar();

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        if( !isIDStart( start ) ){
            throw new RegExpSyntaxError('invalid capture group name');
        };
    };
    name += start;

    for( ;; ){
        var save = this.pos;
        var part = this.parseCaptureNameChar();
        if( !isIDPart( part ) ){
            this.pos = save;
            break;
        };
        name += part;
    };

    if( this.current() !== '>' && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid capture group name');
    };
    ++this.pos; // skip '>'

    return name;
};

/**
 * Parse capture name character.
 *
 * Unicode escape sequences are used as capture name character.
 *
 * @return {string}
 */
Parser.prototype.parseCaptureNameChar = function(){
    var c = this.current();

    if( c === '\\' ){
        return this.tryParseUnicodeEscape( true );
    };
    this.pos += c.length; // skip any character
    return c;
};

/** Parse digits. If parsing is failed, return `-1`.
 *
 * @return {number}
 */
Parser.prototype.parseDigits = function(){
    var s = '';

    while( isDigit( this.current() ) ){
        s += this.current();
        ++this.pos; // skip digit
    };
    return s === '' ? -1 : /* Number. */ parseInt( s, 10 );
};

/** Parse hex digits. If parsing is failed, return `-1`.
 *
 * @return {number}
 */
Parser.prototype.parseHexDigits = function(){
    var s = '';

    for( var c; isHexDigit( c = this.current() ); ){
        s += c;
        this.pos += c.length; // skip hex digit
    };
    return s === '' ? -1 : /* Number. */ parseInt( s, 16 );
};

/** Try to parse `n` characters of hex digits.  If parsing is faield, return `-1`.
 *
 * @param {number} n
 * @return {number}
 */
Parser.prototype.tryParseHexDigitsN = function( n ){
    var save = this.pos;
    var s = '';
    while( n-- > 0 ){
        var c = this.current();
        if( !isHexDigit( c ) ){
            this.pos = save;
            return -1;
        };
        s += c;
        this.pos += c.length; // skip hex digit
    };
    return /* Number. */ parseInt( s, 16 );
};

/** Return the current character.
 * @return {string}
 */
Parser.prototype.current = function(){
    var c;

    if( DEFINE_REGEXP_COMPAT__ES2018 && this.unicode ){
        c = String_codePointAt( this.source, this.pos );
        return c === undefined ? '' : String_fromCodePoint( c );
    };
    c = this.source.charCodeAt( this.pos );
    return /* Number.isNaN( c ) */ c !== c ? '' : String_fromCharCode( c );
};
