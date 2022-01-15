/** Check the node is assertion, which means cannot become a child of repetition node.
 * 
 * @param {RegExpPaternNode} n 
 * @return {boolean} 
 */
function isAssertion( n ){
    switch( n.type ){
        case 'WordBoundary':
        case 'LineBegin':
        case 'LineEnd':
        case 'LookAhead':
        case 'LookBehind':
            return true;
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
    return c !== '' && '^$\\.*+?()[]{}|'.includes( c );
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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const idStart = new CharSet(property.get('ID_Start'));

/** Check the character is identifier start character.
 * @param {string} c
 * @return {boolean}
 */
function isIDStart( c ){
    var cp;

    return c === '$' || c === '_' || !!idStart.has( ( cp = String_codePointAt( c, 0 ) ) !== undefined ? cp : -1 );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const idContinue = new CharSet(property.get('ID_Continue'));

/** Check the character is identifier part character.
 * @param {string} c
 * @return {boolean}
 */
function isIDPart( c ){
    var cp;

    return c === '$' || c === '\u200C' || c === '\u200D' || !!idContinue.has( ( cp = String_codePointAt( c, 0 ) ) !== undefined ? cp : -1 );
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
function Parser( source, flags, additional ){
     /** Precalculated number of capture group parens. */
    this.captureParens = 0;
    /** Precalculated `Map` associate from capture group name to its index. */
    this.names = new Map();
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
    /** @type {boolean} Is the `flagSet` has `unicode`? */
    this.unicode = this.flagSet.unicode;

    this.preprocessCaptures();

    this.pos = 0;
    const child = this.parseDisjunction();
    if( this.current() !== '' && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError( "too many ')'" );
    };

    return {
        type          : 'Pattern',
        flagSet       : this.flagSet,
        captureParens : this.captureParens,
        names         : this.names,
        child         : child,
        range         : [ 0, this.pos ]
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
            unicode    : false,
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
            case 'u':
                if( flagSet.unicode && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError("duplicated 'u' flag");
                };
                flagSet.unicode = true;
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
    const len = this.source.length;

    while( this.pos < len ){
        const c = this.current();
        switch( c ){
            case '(' :
                if( String_startsWith( this.source, '(?<', this.pos ) ){
                    this.pos += 3; // skip '(?<'
                    const d = this.current();
                    if( d !== '=' && d !== '!' ){
                        ++this.captureParens;
                        const name = this.parseCaptureName();
                        this.names.set( name, this.captureParens );
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
        const c = this.current();
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
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseDisjunction = function(){
    const begin = this.pos;
    const children = [ this.parseSequence() ];

    for( ;; ){
        if( this.current() !== '|' ){
            break;
        };
        ++this.pos; // skip '|'
        children.push( this.parseSequence() );
    };

    if( children.length === 1 ){
        return children[0];
    };

    return { type : 'Disjunction', children : children, range : [ begin, this.pos ] };
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
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseSequence = function(){
    const begin = this.pos;
    const children = [];

    for( ; !isSequenceDelimiter( this.current() ); ){
        children.push( this.parseQuantifier() );
    };

    if( children.length === 1 ){
        return children[ 0 ];
    };

    return { type: 'Sequence', children : children, range: [ begin, this.pos ] };
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
    const begin = this.pos;
    const child = /** @type {RegExpPaternNode} */ ( this.parseAtom() );

    if( isAssertion( child ) ){
        if( this.additional && !this.unicode && child.type === 'LookAhead' ){
        } else {
            return child;
        };
    };

    switch( this.current() ){
        case '*':
            return this.parseSimpleQuantifier( 'Many', begin, child );
        case '+':
            return this.parseSimpleQuantifier( 'Some', begin, child );
        case '?':
            return this.parseSimpleQuantifier( 'Optional', begin, child );
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
 * @param {string} type 
 * @param {number} begin 
 * @param {RegExpPaternNode} child 
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseSimpleQuantifier = function( type, begin, child ){
    ++this.pos; // skip one of '*', '+', '?'
    let nonGreedy = false;
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
    const save = this.pos;
    const quantifier = this.tryParseRepeatQuantifier();

    if( !quantifier ){
        if( this.additional && !this.unicode ){
            this.pos = save;
            return child;
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('incomplete quantifier');
        };
    };

    const min = quantifier.min,
          max = quantifier.max;
    if( min > ( max !== null ? max : min ) && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('numbers out of order in quantifier');
    };

    let nonGreedy = false;
    if( this.current() === '?' ){
        ++this.pos; // skip '?'
        nonGreedy = true;
    };

    return {
        type      : 'Repeat',
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
    const save = this.pos;
    ++this.pos; // skip '{'

    const min = this.parseDigits();
    if( min < 0 ){
        this.pos = save;
        return;
    };

    let max = null;
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

    return { min, max };
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
    const begin = this.pos;
    const c = this.current();

    switch( c ){
        case '.':
            ++this.pos; // skip '.'
            return { type: 'Dot', range: [ begin, this.pos ] };
        case '^':
            ++this.pos; // skip '^'
            return { type: 'LineBegin', range: [ begin, this.pos ] };
        case '$':
            ++this.pos; // skip '$'
            return { type: 'LineEnd', range: [ begin, this.pos ] };
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
            if( this.additional && !this.unicode ){
                const quantifier = this.tryParseRepeatQuantifier();
                if( quantifier && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('nothing to repeat');
                };
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone quantifier brackets');
            };
        case '}':
            if( this.additional && !this.unicode ){
                break;
            };
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('lone quantifier brackets');
            };
        case ']':
            if( this.additional && !this.unicode ){
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
    const value = String_codePointAt( c, 0 );
    if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: invalid character');
    };
    return { type : 'Char', value : value, raw : c, range : [ begin, this.pos ] };
};

/** Parse `character class` pattern.
 * @return {RegExpPaternNode}
 */
Parser.prototype.parseClass = function(){
    const begin = this.pos;
    ++this.pos; // skip '['

    let invert = false;
    if( this.current() === '^' ){
        ++this.pos; // skip '^'
        invert = true;
    };

    const children = [];

    for( ;; ){
        const c = this.current();
        if( c === ']' ){
            break;
        };
        children.push( this.parseClassItem() );
    };
    ++this.pos; // skip ']'

    return { type : 'Class', invert : invert, children : children, range : [ begin, this.pos ] };
};

/** Parse an item of `character class` pattern.
 * @return {ClassItem}
 */
Parser.prototype.parseClassItem = function(){
    const beginPos = this.pos;

    const begin = this.parseClassAtom();
    if( this.current() !== '-' ){
        return /** @type {Char|EscapeClass} */ (begin);
    };
    if( String_startsWith( this.source, '-]', this.pos ) ){
        return /** @type {Char|EscapeClass} */ (begin);
    };

    if( begin.type === 'EscapeClass' ){
        if( this.additional && !this.unicode ){
            return /** @type {EscapeClass} */ (begin);
        };
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError( 'invalid character class' );
        };
    };

    const save = this.pos;
    ++this.pos; // skip '-'
    const end = this.parseClassAtom();
    if( end.type === 'EscapeClass' ){
        if( this.additional && !this.unicode ){
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

    return { type: 'ClassRange', children : [ begin, end ], range: [ beginPos, this.pos ] };
};

/** Parse an atom of `character class` range.
 * @return {Char|EscapeClass|undefined}
 */
Parser.prototype.parseClassAtom = function(){
    const begin = this.pos;
    const c = this.current();

    if( c === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('unterminated character class');
    };

    if( c !== '\\' ){
        this.pos += c.length; // skip any character
        const value = c.codePointAt(0);
        if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid character');
        };
        return { type : 'Char', value : value, raw : c, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '\\-', this.pos ) ){
        this.pos += 2; // skip '\\-'
        return { type : 'Char', value : 0x2d, raw : '\\-', range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '\\b', this.pos ) ){
        this.pos += 2; // skip '\\b'
        return { type : 'Char', value : 0x08, raw : '\\b', range : [ begin, this.pos ] };
    };

    const escapeClass = this.tryParseEscapeClass();
    if( escapeClass ){
        return escapeClass;
    };

    const escape = this.tryParseEscape();
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
    const wordBoundary = this.tryParseWordBoundary();
    if( wordBoundary ){
        return wordBoundary;
    };

    const backRef = this.tryParseBackRef();
    if( backRef ){
        return backRef;
    };

    const escapeClass = this.tryParseEscapeClass();
    if( escapeClass ){
        return escapeClass;
    };

    const escape = this.tryParseEscape();
    if( escape ){
        return escape;
    };

    if( DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid escape');
    };
};

/** Try to parse `word boundary` pattern.
 * @return {RegExpPaternNode|undefined}
 */
Parser.prototype.tryParseWordBoundary = function(){
    const begin = this.pos;

    if( String_startsWith( this.source, '\\b', this.pos ) ){
        this.pos += 2; // skip '\\b'
        return { type : 'WordBoundary', invert : false, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '\\B', this.pos ) ){
        this.pos += 2; // skip '\\B'
        return { type : 'WordBoundary', invert : true, range : [ begin, this.pos ] };
    };
};

/** Try to parse `back reference` pattern
 * @return {RegExpPaternNode|undefined}
 */
Parser.prototype.tryParseBackRef = function(){
    const begin = this.pos;
    ++this.pos; // skip '\\';

    if( this.names.size > 0 ){
        if( this.current() === 'k' ){
            ++this.pos; // skip 'k'
            if( this.current() !== '<' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid named back reference');
            };
            const namePos = ++this.pos; // skip '<'
            const name = this.parseCaptureName();
            return {
                type  : 'NamedBackRef',
                name  : name,
                raw   : this.source.slice( namePos, this.pos - 1 ),
                range : [ begin, this.pos ]
            };
        };
    };

    if( this.current() !== '0' ){
        const index = this.parseDigits();
        if( index >= 1 ){
            if( this.additional && !this.unicode ){
                if( index <= this.captureParens ){
                    return { type: 'BackRef', index : index, range : [ begin, this.pos ] };
                };
            } else {
                return { type: 'BackRef', index : index, range : [ begin, this.pos ] };
            };
        };
    };

    this.pos = begin;
};

/** Try to parse `escape sequence` pattern.
 * @return {Char|undefined}
 */
Parser.prototype.tryParseEscape = function(){
    const begin = this.pos;

    const unicode = this.tryParseUnicodeEscape( true );
    if( unicode !== '' ){
        const value = unicode.codePointAt(0);
        if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid character');
        };
        return {
            type  : 'Char',
            value : value,
            raw   : this.source.slice( begin, this.pos ),
            range : [ begin, this.pos ]
        };
    };

    ++this.pos; // skip '\\'
    switch( this.current() ){
        case 't':
            ++this.pos; // skip 't'
            return { type: 'Char', value: 0x09, raw: '\\t', range: [ begin, this.pos ] };
        case 'n':
            ++this.pos; // skip 'n'
            return { type: 'Char', value: 0x0a, raw: '\\n', range: [ begin, this.pos ] };
        case 'v':
            ++this.pos; // skip 'v'
            return { type: 'Char', value: 0x0b, raw: '\\v', range: [ begin, this.pos ] };
        case 'f':
            ++this.pos; // skip 'f'
            return { type: 'Char', value: 0x0c, raw: '\\f', range: [ begin, this.pos ] };
        case 'r':
            ++this.pos; // skip 'r'
            return { type: 'Char', value: 0x0d, raw: '\\r', range: [ begin, this.pos ] };
        case 'c': {
            ++this.pos; // skip 'c'
            const c = this.current();
            let value = 0;
            if( isControl( c ) ){
                ++this.pos; // skip a-z or A-Z
                value = c.charCodeAt( 0 ) % 32;
            } else {
                if( this.additional && !this.unicode ){
                    --this.pos; // go back 'c'
                    break;
                };
                if( DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError('invalid control escape');
                };
            };
            return {
                type  : 'Char',
                value : value,
                raw   : this.source.slice( begin, this.pos ),
                range : [ begin, this.pos ]
            };
        }
        case 'x': {
            ++this.pos; // skip 'x'
            const value = this.tryParseHexDigitsN( 2 );
            if( value < 0 ){
                --this.pos; // go back 'x'
                break;
            };
            return {
                type  : 'Char',
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
            return { type : 'Char', value : 0, raw : '\\0', range : [ begin, this.pos ] };
        };
        case '':
            if( DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('\\ at end of pattern');
            };
    };

    // Legacy octal escape.
    if( this.additional && !this.unicode ){
        const octal = this.pos;
        const c0 = this.current();
        if( '0' <= c0 && c0 <= '3' ){
            ++this.pos;
            const c1 = this.current();
            if( '0' <= c1 && c1 <= '7' ){
                ++this.pos;
                const c2 = this.current();
                if( '0' <= c2 && c2 <= '7' ){
                    ++this.pos;
                };
            };
        } else if( '4' <= c0 && c0 <= '7' ){
            ++this.pos;
            const c1 = this.current();
            if( '0' <= c1 && c1 <= '7' ){
                ++this.pos;
            };
        };
        if( octal !== this.pos ){
            const value = Number.parseInt( this.source.slice( octal, this.pos ), 8 );
            return {
                type  : 'Char',
                value : value,
                raw   : this.source.slice( begin, this.pos ),
                range : [ begin, this.pos ]
            };
        };
    };

    // Identity escape.
    const c = this.current();
    const value = c.codePointAt( 0 );
    if( value === undefined && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error( 'BUG: invalid character' );
    };
    if( this.unicode ){
        if( isSyntax( c ) || c === '/' ){
            this.pos += c.length; // skip any char
            return { type : 'Char', value : value, raw : '\\' + c, range : [ begin, this.pos ] };
        };
    } else {
        if( this.additional ){
            if( c === 'c' ){
                return { type : 'Char', value : 0x5c, raw : '\\', range : [ begin, this.pos ] };
            };
            if( this.names.size === 0 || c !== 'k' ){
                this.pos += c.length; // skip any char
                return { type : 'Char', value, raw : '\\' + c, range : [ begin, this.pos ] };
            }
        } else {
            if( !idContinue.has( value ) ){
                this.pos += c.length; // skip any char
                return { type: 'Char', value : value, raw: '\\' + c, range : [ begin, this.pos ] };
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
    const begin = this.pos;
    ++this.pos; // skip '\\'

    if( this.current() !== 'u' ){
        this.pos = begin;
        return '';
    };
    ++this.pos; // skip 'u'

    if( this.unicode && this.current() === '{' ){
        if( !lead ){
            this.pos = begin;
            return '';
        };
        ++this.pos; // skip '{'
        const c = this.parseHexDigits();
        if( c < 0 || 0x110000 <= c || this.current() !== '}' ){
            throw new RegExpSyntaxError('invalid Unicode escape');
        };
        ++this.pos; // skip '}'
        return String_fromCodePoint( c );
    };

    const c = this.tryParseHexDigitsN( 4 );
    if( c < 0 ){
        if( this.additional && !this.unicode ){
            this.pos = begin;
            return '';
        };
        throw new RegExpSyntaxError('invalid Unicode escape');
    };

    const s = String_fromCharCode( c );
    if( !this.unicode ){
        return s;
    };

    if( lead && '\uD800' <= s && s <= '\uDBFF' && this.current() === '\\' ){
        const save = this.pos;
        const t = this.tryParseUnicodeEscape( false );
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
    const begin = this.pos;
    ++this.pos; // skip '\\'

    const c = this.current();
    switch( c ){
        case 'd':
        case 'D':
            ++this.pos; // skip 'd' or 'D'
            return { type: 'EscapeClass', kind: 'digit', invert: c === 'D', range: [ begin, this.pos ] };
        case 'w':
        case 'W':
            ++this.pos; // skip 'w' or 'W'
            return { type: 'EscapeClass', kind: 'word', invert: c === 'W', range: [ begin, this.pos ] };
        case 's':
        case 'S':
            ++this.pos; // skip 's' or 'S'
            return { type: 'EscapeClass', kind: 'space', invert: c === 'S', range: [ begin, this.pos ] };
        case 'p':
        case 'P': {
            if( !this.unicode ){
                break;
            };
            const invert = c === 'P';
            ++this.pos; // skip 'p' or 'P'

            if( this.current() !== '{' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid Unicode property escape');
            };
            ++this.pos; // skip '{'

            const property = this.parseUnicodePropertyName();
            if( property === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid Unicode property name');
            };

            if( this.current() === '}' ){
                ++this.pos; // skip '}'
                return {
                    type     : 'EscapeClass',
                    kind     : 'unicode_property',
                    property : property,
                    invert   : invert,
                    range    : [ begin, this.pos ]
                };
            };

            if( this.current() !== '=' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid Unicode property escape');
            };
            ++this.pos; // skip '='

            const value = this.parseUnicodePropertyValue();
            if( value === '' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid Unicode property value');
            };

            if( this.current() !== '}' && DEFINE_REGEXP_COMPAT__DEBUG ){
                throw new RegExpSyntaxError('invalid Unicode property escape');
            };
            ++this.pos; // skip '}'

            return {
                type     : 'EscapeClass',
                kind     : 'unicode_property_value',
                property : property,
                value    : value,
                invert   : invert,
                range    : [ begin, this.pos ]
            };
        };
    };

    this.pos = begin;
};

/** Parse the first component of `\p{XXX=XXX}` escape sequence.
 * @return {string}
 */
Parser.prototype.parseUnicodePropertyName = function(){
    let p = '';

    for( let c; isUnicodeProperty( c = this.current() ); ){
        p += c;
        this.pos += c.length; // skip any character
    };
    return p;
};

/** Parse the second component of `\p{XXX=XXX}` escape sequence.
 * @return {string}
 */
Parser.prototype.parseUnicodePropertyValue = function(){
    let v = '';

    for( let c; isUnicodePropertyValue( c = this.current() ); ){
        v += c;
        this.pos += c.length; // skip any character
    };
    return v;
};

/** Parse grouping pattern by paren.
 * @return {RegExpPaternNode|undefined}
 */
Parser.prototype.parseParen = function(){
    const begin = this.pos;

    if( !String_startsWith( this.source, '(?', this.pos ) ){
        ++this.pos; // skip '('
        const child = this.parseDisjunction();
        const index = ++this.captureParensIndex;
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated capture');
        };
        ++this.pos; // skip ')'
        return { type: 'Capture', index : index, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?:', this.pos ) ){
        this.pos += 3; // skip '(?:'
        const child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated group');
        };
        ++this.pos; // skip ')'
        return { type : 'Group', child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?=', this.pos ) ){
        this.pos += 3; // skip '(?='
        const child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated look-ahead');
        };
        ++this.pos; // skip ')'
        return { type : 'LookAhead', negative : false, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?!', this.pos ) ){
        this.pos += 3; // skip '(?!'
        const child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated look-ahead');
        };
        ++this.pos; // skip ')'
        return { type : 'LookAhead', negative : true, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?<=', this.pos ) ){
        this.pos += 4; // skip '(?<='
        const child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated look-behind');
        };
        ++this.pos; // skip ')'
        return { type : 'LookBehind', negative : false, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?<!', this.pos ) ){
        this.pos += 4; // skip '(?<!'
        const child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated look-behind');
        };
        ++this.pos; // skip ')'
        return { type : 'LookBehind', negative : true, child : child, range : [ begin, this.pos ] };
    };

    if( String_startsWith( this.source, '(?<', this.pos ) ){
        const index = ++this.captureParensIndex;
        this.pos += 3; // skip '(?<'
        const namePos = this.pos;
        const name = this.parseCaptureName();
        const raw = this.source.slice( namePos, this.pos - 1 );
        if( this.names.get( name ) !== index && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid named capture');
        };
        const child = this.parseDisjunction();
        if( this.current() !== ')' && DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new RegExpSyntaxError('unterminated named capture');
        };
        ++this.pos; // skip ')'
        return /** @type {NamedCapture} */ ({ type : 'NamedCapture', name : name, raw : raw, child : child, range : [ begin, this.pos ] });
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
    let name = '';
    const start = this.parseCaptureNameChar();
    if( !isIDStart( start ) && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new RegExpSyntaxError('invalid capture group name');
    };
    name += start;

    for( ;; ){
        const save = this.pos;
        const part = this.parseCaptureNameChar();
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
    const c = this.current();

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
    let s = '';

    while( isDigit( this.current() ) ){
        s += this.current();
        ++this.pos; // skip digit
    };
    return s === '' ? -1 : Number.parseInt( s, 10 );
};

/** Parse hex digits. If parsing is failed, return `-1`.
 *
 * @return {number}
 */
Parser.prototype.parseHexDigits = function(){
    let s = '';

    for( let c; isHexDigit( c = this.current() ); ){
        s += c;
        this.pos += c.length; // skip hex digit
    };
    return s === '' ? -1 : Number.parseInt( s, 16 );
};

/** Try to parse `n` characters of hex digits.  If parsing is faield, return `-1`.
 *
 * @param {number} n
 * @return {number}
 */
Parser.prototype.tryParseHexDigitsN = function( n ){
    const save = this.pos;
    let s = '';
    while( n-- > 0 ){
        const c = this.current();
        if( !isHexDigit( c ) ){
            this.pos = save;
            return -1;
        };
        s += c;
        this.pos += c.length; // skip hex digit
    };
    return Number.parseInt( s, 16 );
};

/** Return the current character.
 * @return {string}
 */
Parser.prototype.current = function(){
    if( this.unicode ){
        const c = String_codePointAt( this.source, this.pos );
        return c === undefined ? '' : String_fromCodePoint( c );
    };
    const c = this.source.charCodeAt( this.pos );
    return Number.isNaN( c ) ? '' : String_fromCharCode( c );
};
