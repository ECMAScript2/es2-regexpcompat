goog.provide( 'vm.escapeCodePointAsRegExpSourceChar' );
goog.provide( 'vm.nodeToString' );
goog.provide( 'vm.flagSetToString' );
goog.provide( 'vm.patternToString' );

goog.require( 'vm.shim.str.padStringWithZero' );
goog.require( 'vm.shim.str.fromCodePoint' );
goog.require( 'vm.EnumPattern' );
goog.require( 'vm.EnumKind' );
goog.require( 'vm.SUPPORT_ES2018' );
goog.require( 'vm.shim.ary.map' );
goog.requireType( 'vm.d.FlagSet' );

goog.scope(
    function(){
        /** Escapes raw character for showing.
         *
         * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-escaperegexppattern.
         * 
         * @param {string} raw 
         * @return {string} */
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
         * @param {!ClassItem} n
         * @return {string | void} */
        function classItemToString( n ){
            switch( n.type ){
                case vm.EnumPattern.Char :
                    return escapeRaw( /** @type {!Char} */ (n).raw );
                // The above `switch-case` is exhaustive and it is checked by `tsc`, so `eslint` rule is disabled.
                case vm.EnumPattern.ClassRange :
                    return escapeRaw( /** @type {!ClassRange} */ (n).children[ 0 ].raw ) + '-' + escapeRaw( /** @type {!ClassRange} */ (n).children[ 1 ].raw );
                case vm.EnumPattern.EscapeClass :
                    switch( n.kind ){
                        case vm.EnumKind.digit :
                            return /** @type {!SimpleEscapeClass} */ (n).invert ? '\\D' : '\\d';
                        case vm.EnumKind.word :
                            return /** @type {!SimpleEscapeClass} */ (n).invert ? '\\W' : '\\w';
                        case vm.EnumKind.space :
                            return /** @type {!SimpleEscapeClass} */ (n).invert ? '\\S' : '\\s';
                        case vm.EnumKind.unicode_property :
                            if( vm.SUPPORT_ES2018 ){
                                return '\\' + ( /** @type {!UnicodePropertyEscapeClass} */ (n).invert ? 'P{' : 'p{' ) + /** @type {!UnicodePropertyEscapeClass} */ (n).property + '}';
                            };
                        case vm.EnumKind.unicode_property_value :
                            if( vm.SUPPORT_ES2018 ){
                                return '\\' + ( /** @type {!UnicodePropertyValueEscapeClass} */ (n).invert ? 'P{' : 'p{' ) + /** @type {!UnicodePropertyValueEscapeClass} */ (n).property + '=' + n.value + '}';
                            };
                    };
            };
        };

        /** Escape a code point as regular expression source character.
         * 
         * @param {number} c 
         * @param {boolean=} opt_inCharClass 
         * @return {string} */
        vm.escapeCodePointAsRegExpSourceChar = function( c, opt_inCharClass ){
            // Common escape character.
            switch( c ){
                case 0x09:
                    return '\\t';
                case 0x0a:
                    return '\\n';
                case 0x0b:
                    return '\\v';
                case 0x0c:
                    return '\\f';
                case 0x0d:
                    return '\\r';
                case 0x5c:
                    return '\\\\';
                case 0x5e:
                    return '\\^';
                case 0x5d:
                    return '\\]';
            };

            if( opt_inCharClass ){
                // In char class, we can use `'\b'` escape.
                if( c === 0x08 ){
                    return '\\b';
                };
                // In char class, `'-'` must be escaped.
                if( c === 0x2d ){
                    return '\\-';
                };
            } else {
                // Character having meaning in pattern string.
                switch( c ){
                    case 0x24:
                        return '\\$';
                    case 0x28:
                        return '\\(';
                    case 0x29:
                        return '\\)';
                    case 0x2a:
                        return '\\*';
                    case 0x2b:
                        return '\\+';
                    case 0x2e:
                        return '\\.';
                    case 0x2f:
                        return '\\/';
                    case 0x3f:
                        return '\\?';
                    case 0x5b:
                        return '\\[';
                    case 0x7b:
                        return '\\{';
                    case 0x7c:
                        return '\\|';
                    case 0x7d:
                        return '\\}';
                };
            };

            // Control character uses hex escape.
            if( c <= 0x1f || ( 0x7f <= c && c <= 0xff ) ){
                return '\\x' + vm.shim.str.padStringWithZero( c.toString( 16 ), 2 );
            };

            // ASCII character returns itself.
            if( c <= 0x80 ){
                return vm.shim.str.fromCodePoint( c );
            };

            // BMP code point use `\uXXXX`.
            if( c <= 0xffff ){
                return '\\u' + vm.shim.str.padStringWithZero( c.toString( 16 ), 4 );
            };

            // Other code point use `\u{XXXXXX}`.
            return '\\u{' + c.toString( 16 ) + '}';
        };

        /**
         * @param {!RegExpPaternNode} n
         * @return {string | void} */
        vm.nodeToString = function( n ){
            switch( n.type ){
                case vm.EnumPattern.Disjunction :
                    return vm.shim.ary.map( n.children, vm.nodeToString ).join( '|' );
                case vm.EnumPattern.Sequence :
                    return vm.shim.ary.map( n.children, vm.nodeToString ).join( '' );
                case vm.EnumPattern.Capture :
                    return '(' + vm.nodeToString( n.child ) + ')';
                case vm.EnumPattern.Group :
                    return '(?:' + vm.nodeToString( n.child ) + ')';
                case vm.EnumPattern.Many :
                    return vm.nodeToString( n.child ) + '*' + ( n.nonGreedy ? '?' : '' );
                case vm.EnumPattern.Some :
                    return vm.nodeToString( n.child ) + '+' + ( n.nonGreedy ? '?' : '' );
                case vm.EnumPattern.Optional :
                    return vm.nodeToString( n.child ) + '?' + ( n.nonGreedy ? '?' : '' );
                case vm.EnumPattern.Repeat :
                    var s = vm.nodeToString( n.child );
                    s += '{' + n.min;
                    if( n.max === Infinity ){
                        s += ',';
                    } else if( ( n.max !== null ? n.max : n.min ) != n.min ){
                        s += ',' + n.max;
                    };
                    s += '}' + ( n.nonGreedy ? '?' : '' );
                    return s;
                case vm.EnumPattern.WordBoundary :
                    return n.invert ? '\\B' : '\\b';
                case vm.EnumPattern.LineBegin :
                    return '^';
                case vm.EnumPattern.LineEnd :
                    return '$';
                case vm.EnumPattern.LookAhead :
                    return '(?' + ( n.negative ? '!' : '=' ) + vm.nodeToString( n.child ) + ')';
                case vm.EnumPattern.Char : {
                    var c = escapeRaw( n.raw );
                    return c === '/' ? '\\/' : c;
                };
                case vm.EnumPattern.EscapeClass :
                    return classItemToString( /** @type {!ClassItem} */ (n) );
                case vm.EnumPattern.Class :
                    return '[' + ( n.invert ? '^' : '' ) + vm.shim.ary.map( n.children, classItemToString ).join('') + ']';
                case vm.EnumPattern.Dot :
                    return '.';
                case vm.EnumPattern.BackRef :
                    return '\\' + n.index;
                case vm.EnumPattern.NamedBackRef :
                    if( vm.SUPPORT_ES2018 ){
                        return '\\k<' + n.raw + '>';
                    };
                case vm.EnumPattern.NamedCapture :
                    if( vm.SUPPORT_ES2018 ){
                        return '(?<' + n.raw + '>' + vm.nodeToString( n.child ) + ')';
                    };
                case vm.EnumPattern.LookBehind :
                    if( vm.SUPPORT_ES2018 ){
                        return '(?<' + ( n.negative ? '!' : '=' ) + vm.nodeToString( n.child ) + ')';
                    };
            };
        };

        /** Show flag set as string.
         *
         * @param {!vm.d.FlagSet} flagSet
         * @return {string} */
        vm.flagSetToString = function( flagSet ){
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
            if( flagSet.sticky /* && vm.SUPPORT_ES2015 */ ){
                s += 'y';
            };
            if( flagSet.dotAll && vm.SUPPORT_ES2018 ){
                s += 's';
            };
            if( flagSet.unicode && vm.SUPPORT_ES2018 ){
                s += 'u';
            };
            return s;
        };

        /** Show pattern as string.
         * 
         * @param {!Pattern} p
         * @return {string} */
        vm.patternToString = function( p ){
            var s = '/';
            var n = vm.nodeToString( p.child );

            s += n === '' ? '(?:)' : n;
            s += '/';
            s += vm.flagSetToString( p.flagSet );
            return s;
        };
    }
);
