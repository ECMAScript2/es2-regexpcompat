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

/**
 * @param {RegExpPaternNode} n
 * @return {string|undefined}
 */
m_nodeToString = function( n ){
    switch( n.type ){
        case REGEXP_COMPAT__PATTERN_IS_Disjunction :
            return Array_map( n.children, m_nodeToString ).join( '|' );
        case REGEXP_COMPAT__PATTERN_IS_Sequence :
            return Array_map( n.children, m_nodeToString ).join( '' );
        case REGEXP_COMPAT__PATTERN_IS_Capture :
            return '(' + m_nodeToString( n.child ) + ')';
        case REGEXP_COMPAT__PATTERN_IS_Group :
            return '(?:' + m_nodeToString( n.child ) + ')';
        case REGEXP_COMPAT__PATTERN_IS_Many :
            return m_nodeToString( n.child ) + '*' + ( n.nonGreedy ? '?' : '' );
        case REGEXP_COMPAT__PATTERN_IS_Some :
            return m_nodeToString( n.child ) + '+' + ( n.nonGreedy ? '?' : '' );
        case REGEXP_COMPAT__PATTERN_IS_Optional :
            return m_nodeToString( n.child ) + '?' + ( n.nonGreedy ? '?' : '' );
        case REGEXP_COMPAT__PATTERN_IS_Repeat :
            var s = m_nodeToString( n.child );
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
            return '(?' + ( n.negative ? '!' : '=' ) + m_nodeToString( n.child ) + ')';
        case REGEXP_COMPAT__PATTERN_IS_Char : {
            var c = escapeRaw( n.raw );
            return c === '/' ? '\\/' : c;
        };
        case REGEXP_COMPAT__PATTERN_IS_EscapeClass :
            return classItemToString( /** @type {ClassItem} */ (n) );
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
                return '(?<' + n.raw + '>' + m_nodeToString( n.child ) + ')';
            };
        case REGEXP_COMPAT__PATTERN_IS_LookBehind :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return '(?<' + ( n.negative ? '!' : '=' ) + m_nodeToString( n.child ) + ')';
            };
    };
};

/** Show flag set as string.
 *
 * @param {FlagSet} flagSet
 * @return {string}
 */
m_flagSetToString = function( flagSet ){
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
    if( flagSet.sticky ){ // ES2015
        s += 'y';
    };
    if( flagSet.dotAll && DEFINE_REGEXP_COMPAT__ES2018 ){
        s += 's';
    };
    if( flagSet.unicode && DEFINE_REGEXP_COMPAT__ES2018 ){
        s += 'u';
    };
    return s;
};

/** Show pattern as string.
 * 
 * @param {Pattern} p
 * @return {string}
 */
m_patternToString = function( p ){
    var s = '/';
    var n = m_nodeToString( p.child );

    s += n === '' ? '(?:)' : n;
    s += '/';
    s += m_flagSetToString( p.flagSet );
    return s;
};
