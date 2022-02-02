var Compiler_DIRECTION_FORWARD  = DEFINE_REGEXP_COMPAT__MINIFY ? 1 : 'forward',
    Compiler_DIRECTION_BACKWARD = DEFINE_REGEXP_COMPAT__MINIFY ? 2 : 'backward';

/** `Compiler` is a compiler for `Pattern` to `Program`.
 * @constructor
 * @param {Pattern} pattern 
 */
Compiler = function( pattern ){
    this.advance            = false;
    this.captureParensIndex = 1;
    this.direction          = Compiler_DIRECTION_FORWARD;
    this.pattern            = pattern;
    this.ignoreCase         = pattern.flagSet.ignoreCase;
    this.captureParens      = pattern.captureParens;
    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        this.names   = pattern.names;
        this.unicode = pattern.flagSet.unicode;
    };
};

/** Run compiler and return compiled `Program`.
 * 
 * @return {Program}
 */
Compiler.prototype.compile = function(){
    var codes0 = this.compileNode( this.pattern.child );
    var codes1 = Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN, index: 0 },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: REGEXP_COMPAT__OPCODE_IS_CAP_END, index: 0 },
        { op: REGEXP_COMPAT__OPCODE_IS_MATCH }
    );
    return new Program( this.pattern, codes1 );
};

/**
 * @param {RegExpPaternNode} node 
 * @return {Array.<OpCode>|undefined}
 */
Compiler.prototype.compileNode = function( node ){
    switch( node.type ){
        case REGEXP_COMPAT__PATTERN_IS_Disjunction :
            return this.compileDisjunction( /** @type {Disjunction} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Sequence :
            return this.compileSequence( /** @type {Sequence} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Capture :
            return this.compileCapture( /** @type {Capture} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Group :
            return this.compileGroup( /** @type {Group} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Many :
            return this.compileMany( /** @type {Many} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Some :
            return this.compileSome( /** @type {Some} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Optional :
            return this.compileOptional( /** @type {Optional} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Repeat :
            return this.compileRepeat( /** @type {Repeat} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_WordBoundary :
            return this.compileWordBoundary( /** @type {WordBoundary} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_LineBegin :
            return this.compileLineBegin( /* node */ );
        case REGEXP_COMPAT__PATTERN_IS_LineEnd :
            return this.compileLineEnd( /* node */ );
        case REGEXP_COMPAT__PATTERN_IS_LookAhead :
            return this.compileLookAhead( /** @type {LookAhead} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Char:
            return this.compileChar( /** @type {Char} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_EscapeClass:
            return this.compileEscapeClass( /** @type {EscapeClass} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Class :
            return this.compileClass( /** @type {Class} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Dot :
            return this.compileDot( /* node */ );
        case REGEXP_COMPAT__PATTERN_IS_BackRef :
            return this.compileBackRef( /** @type {BackRef} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_NamedBackRef :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return this.compileNamedBackRef( /** @type {NamedBackRef} */ (node) );
            };
        case REGEXP_COMPAT__PATTERN_IS_NamedCapture :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return this.compileNamedCapture( /** @type {NamedCapture} */ (node) );
            };
        case REGEXP_COMPAT__PATTERN_IS_LookBehind :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                return this.compileLookBehind( /** @type {LookBehind} */ (node) );
            };
    };
};

/**
 * @param {Disjunction} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileDisjunction = function( node ){
    var _children = node.children,
        l = _children.length;

    if( l === 0 && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: invalid pattern');
    };

    var children = [];
    var advance = true;

    for( var i = 0; i < l; ++i ){
        children.push( this.compileNode( _children[ i ] ) );
        advance = advance && this.advance;
    };

    this.advance = advance;

    return /** @type {Array.<OpCode>} */ (Array_reduceRight( children, toOpCodeArray ));

    function toOpCodeArray( codes, codes0 ){
        return Compiler_pushFlattenedOpCodesToOpCodeList( [],
            { op: REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes0.length + 1 },
            /* ... */ /** @type {Array.<OpCode>} */ (codes0),
            { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: codes.length },
            /* ... */ /** @type {Array.<OpCode>} */ (codes)
        );
    };
};

/**
 * @param {Sequence} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileSequence = function( node ){
    var children = Array_from( node.children );

    if( this.direction === Compiler_DIRECTION_BACKWARD ){
        if( false && children.reverse ){
            children.reverse();
        } else {
            for( var i = 1, child, l = children.length; i < l; ++i ){ // for ie5
                child = children.pop();
                children.unshift( child );
            };
        };
    };

    var codes = [];
    var advance = false;
    for( var i = -1, child; child = children[ ++i ]; ){
        var codes0 = this.compileNode( child );
        Compiler_pushFlattenedOpCodesToOpCodeList( codes, /** @type {Array.<OpCode>} */ (codes0) );
        advance = advance || this.advance;
    };
    this.advance = advance;

    return codes;
};

/**
 * @param {Group} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileGroup = function( node ){
    return /** @type {Array.<OpCode>} */ ( this.compileNode( node.child ) );
};

/**
 * @param {Capture} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileCapture = function( node ){
    var current = this.captureParensIndex++;
    var codes0  = this.compileNode( node.child );

    if( node.index !== current ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid pattern');
        };
    };
    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: this.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_CAP_END : REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN, index: current },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: this.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN : REGEXP_COMPAT__OPCODE_IS_CAP_END, index: current }
    );
};

/**
 * @param {NamedCapture} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileNamedCapture = function( node ){
    var current = this.captureParensIndex++;
    var codes0  = this.compileNode( node.child );
    var index   = this.names[ node.name ];

    if( index === undefined || index !== current ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid pattern');
        };
    };
    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN, index : index },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: REGEXP_COMPAT__OPCODE_IS_CAP_END, index : index }
    );
};

/**
 * @param {Many} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileMany = function( node ){
    var from = this.captureParensIndex;
    var codes0 = this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (this.compileNode( node.child )) );
    var codes1 = this.insertCapReset( from, /** @type {Array.<OpCode>} */ (codes0) );
    this.advance = false;

    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 1 },
        /* ... */ codes1,
        { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: -1 - codes1.length - 1 }
    );
};

/**
 * @param {Some} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileSome = function( node ){
    var from = this.captureParensIndex;
    var codes0 = this.compileNode( node.child );
    var codes1 = this.insertCapReset( from, this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (codes0 ) ) );

    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 1 },
        /* ... */ codes1,
        { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: -1 - codes1.length - 1 }
    );
};

/**
 * @param {Optional} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileOptional = function( node ){
    var codes0 = this.compileNode( node.child );
    this.advance = false;

    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes0.length },
        /* ... */ codes0
    );
};

/**
 * @param {Repeat} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileRepeat = function( node ){
    var from = this.captureParensIndex;
    var min  = node.min;
    var codes0 = this.compileNode( node.child );
    var codes = [];
    var codes1;

    if( min === 1 ){
        Compiler_pushFlattenedOpCodesToOpCodeList( codes, /** @type {Array.<OpCode>} */ (codes0) );
        // codes.push(...codes0);
    } else if( min > 1 ){
        codes1 = this.insertCapReset( from, /** @type {Array.<OpCode>} */ (codes0) );
        Compiler_pushFlattenedOpCodesToOpCodeList(
            codes,
            { op: REGEXP_COMPAT__OPCODE_IS_PUSH, value: min },
            /* ... */ codes1,
            { op: REGEXP_COMPAT__OPCODE_IS_DEC },
            { op: REGEXP_COMPAT__OPCODE_IS_LOOP, cont: -1 - codes1.length - 1 },
            { op: REGEXP_COMPAT__OPCODE_IS_POP }
        );
    } else {
        this.advance = false;
    };

    var max = node.max != null ? node.max : min;
    if( max === Infinity ){
        codes1 = this.insertCapReset( from, this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (codes0) ) );
        Compiler_pushFlattenedOpCodesToOpCodeList(
            codes,
            { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 1 }, // next: は (1) を指す
            /* ... */ codes1,
            { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: -1 - codes1.length - 1 } // cont: は (1) を指す
        );
    } else if( max > min ){
        var remain = max - min;
        codes1 = this.insertCapReset( from, this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (codes0) ) );
        if( remain === 1 ){
            Compiler_pushFlattenedOpCodesToOpCodeList(
                codes,
                { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length }, // next: は (2) を指す
                /* ... */ codes1 // (2)
            );
        } else {
            Compiler_pushFlattenedOpCodesToOpCodeList(
                codes,
                { op: REGEXP_COMPAT__OPCODE_IS_PUSH, value: remain + 1 }, // (3)
                { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 4 }, // next: は (4) を指す
                /* ... */ codes1,
                { op: REGEXP_COMPAT__OPCODE_IS_DEC },
                { op: REGEXP_COMPAT__OPCODE_IS_LOOP, cont: -1 - codes1.length - 2 }, // cont: は (3) を指す
                { op: REGEXP_COMPAT__OPCODE_IS_FAIL },
                { op: REGEXP_COMPAT__OPCODE_IS_POP } // (4)
            );
        };
    };

    return codes;
};

/**
 * @param {Array.<OpCode>} codes0 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.insertEmptyCheck = function( codes0 ){
    return this.advance ? codes0 : Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: REGEXP_COMPAT__OPCODE_IS_PUSH_POS },
        /* ... */ codes0,
        { op: REGEXP_COMPAT__OPCODE_IS_EMPTY_CHECK }
    );
};

/**
 * @param {number} from
 * @param {Array.<OpCode>} codes0 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.insertCapReset = function( from, codes0 ){
    if( from === this.captureParensIndex ){
        return codes0;
    };
    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: REGEXP_COMPAT__OPCODE_IS_CAP_RESET, from : from, to: this.captureParensIndex },
        /* ... */ codes0
    );
};

/**
 * @param {WordBoundary} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileWordBoundary = function( node ){
    this.advance = false;
    return [{ op: node.invert ? REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY_NOT : REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY }];
};

/**
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLineBegin = function( /* _node */ ){
    this.advance = false;
    return [{ op: REGEXP_COMPAT__OPCODE_IS_LINE_BEGIN }];
};

/**
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLineEnd = function( /* _node */ ){
    this.advance = false;
    return [{ op: REGEXP_COMPAT__OPCODE_IS_LINE_END }];
};

/**
 * @param {LookAhead} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLookAhead = function( node ){
    var oldDirection = this.direction;
    this.direction = Compiler_DIRECTION_FORWARD;
    var codes = this.compileLookAround( node );
    this.direction = oldDirection;
    return codes;
};

/**
 * @param {LookBehind} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLookBehind = function( node ){
    var oldDirection = this.direction;
    this.direction = Compiler_DIRECTION_BACKWARD;
    var codes = this.compileLookAround( node );
    this.direction = oldDirection;
    return codes;
};

/**
 * @param {LookAhead|LookBehind} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLookAround = function( node ){
    var codes0 = this.compileNode( node.child );
    this.advance = false;

    if( node.negative ){
        return Compiler_pushFlattenedOpCodesToOpCodeList( [],
            { op: REGEXP_COMPAT__OPCODE_IS_PUSH_POS },
            { op: REGEXP_COMPAT__OPCODE_IS_PUSH_PROC },
            { op: REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes0.length + 2 },
            /* ... */ /** @type {Array.<OpCode>} */ (codes0),
            { op: REGEXP_COMPAT__OPCODE_IS_REWIND_PROC },
            { op: REGEXP_COMPAT__OPCODE_IS_FAIL },
            { op: REGEXP_COMPAT__OPCODE_IS_POP },
            { op: REGEXP_COMPAT__OPCODE_IS_RESTORE_POS }
        );
    };

    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: REGEXP_COMPAT__OPCODE_IS_PUSH_POS },
        { op: REGEXP_COMPAT__OPCODE_IS_PUSH_PROC },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: REGEXP_COMPAT__OPCODE_IS_REWIND_PROC },
        { op: REGEXP_COMPAT__OPCODE_IS_RESTORE_POS }
    );
};

/**
 * @param {Char} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileChar = function( node ){
    var value = node.value;
    if( this.ignoreCase ){
      value = canonicalize( value, this.unicode );
    };
    this.advance = true;
    return this.insertBack( [ { op: REGEXP_COMPAT__OPCODE_IS_CHAR, value : value } ] );
};

/**
 * @param {EscapeClass} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileEscapeClass = function( node ){
    var set = this.escapeClassToSet( node );
    this.advance = true;
    return this.insertBack( [ { op: REGEXP_COMPAT__OPCODE_IS_CLASS, set : set } ] );
};

/**
 * @param {Class} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileClass = function( node ){
    var set = new CharSet(),
        classItemList = node.children;

    for( var /** @type {ClassItem} */ item, i = -1; item = classItemList[ ++i ]; ){
        switch( item.type ){
            case REGEXP_COMPAT__PATTERN_IS_Char :
                set.add( item.value, item.value + 1 );
                break;
            case REGEXP_COMPAT__PATTERN_IS_EscapeClass :
                set.addCharSet( this.escapeClassToSet( /** @type {EscapeClass} */ (item) ) );
                break;
            case REGEXP_COMPAT__PATTERN_IS_ClassRange :
                set.add( item.children[ 0 ].value, item.children[ 1 ].value + 1 );
                break;
        };
    };
    this.advance = true;
    return this.insertBack( [ { op: node.invert ? REGEXP_COMPAT__OPCODE_IS_CLASS_NOT : REGEXP_COMPAT__OPCODE_IS_CLASS, set : set } ] );
};

/**
 * @param {EscapeClass} _node 
 * @return {CharSet|undefined}
 */
Compiler.prototype.escapeClassToSet = function( _node ){
    var node;

    switch( _node.kind ){
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_digit :
            node = /** @type {SimpleEscapeClass} */ ( _node );
            return node.invert ? m_charSetInvertDigit : m_charSetDigit;
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_word :
            node = /** @type {SimpleEscapeClass} */ ( _node );
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                if( this.unicode && this.ignoreCase ){
                    return node.invert ? m_charSetInvertUnicodeWord : m_charSetUnicodeWord;
                };
            };
            return node.invert ? m_charSetInvertWord : m_charSetWord;
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_space :
            node = /** @type {SimpleEscapeClass} */ ( _node );
            return node.invert ? m_charSetInvertSpace : m_charSetSpace;
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                node = /** @type {UnicodePropertyEscapeClass} */ ( _node );
                var set = m_loadCategory( node.property ) || m_loadProperty( node.property );
                
                if( !set && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError( 'invalid Unicode property' );
                };
                return node.invert ? set.clone().invert() : set;
            };
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property_value :
            if( DEFINE_REGEXP_COMPAT__ES2018 ){
                node = /** @type {UnicodePropertyValueEscapeClass} */ ( _node );
                var set = m_loadPropertyValue( node.property, node.value );

                if( !set && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError( 'invalid Unicode property value' );
                };
                return node.invert ? set.clone().invert() : set;
            };
    };
};

/**
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileDot = function( /* _node */ ){
    this.advance = true;
    return this.insertBack( [ { op : REGEXP_COMPAT__OPCODE_IS_ANY } ] );
};

/**
 * @param {Array.<OpCode>} codes 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.insertBack = function( codes ){
    if( this.direction === Compiler_DIRECTION_FORWARD ){
        return codes;
    };
    return Compiler_pushFlattenedOpCodesToOpCodeList( [],
        { op: REGEXP_COMPAT__OPCODE_IS_BACK },
        /* ... */ codes,
        { op: REGEXP_COMPAT__OPCODE_IS_BACK }
    );
};

/**
 * @param {BackRef} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileBackRef = function( node ){
    if( node.index < 1 || this.captureParens < node.index ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('invalid back reference');
        };
    };
    this.advance = false;
    return [ { op: this.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_REF_BACK : REGEXP_COMPAT__OPCODE_IS_REF, index : node.index } ];
};

/**
 * @param {NamedBackRef} node
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileNamedBackRef = function( node ){
    var index = this.names[ node.name ];

    if( index === undefined || index < 1 || this.captureParens < index ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('invalid named back reference');
        };
    };
    this.advance = false;
    return [ { op: this.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_REF_BACK : REGEXP_COMPAT__OPCODE_IS_REF, index : index } ];
};

/**
 * @param {Array.<OpCode>} targetArray
 * @param {...(OpCode|Array.<OpCode>)} _args
 * @return {Array.<OpCode>}
 */
function Compiler_pushFlattenedOpCodesToOpCodeList( targetArray, _args ){
    var args = arguments,
        l    = args.length,
        i    = 1,
        j    = targetArray.length - 1,
        val;

    for( ; i < l; ++i ){
        val = args[ i ];
        if( val && val.pop ){ // isArray
            for( var k = 0, m = val.length; k < m; ++k ){
                targetArray[ ++j ] = val[ k ];
            };
        } else {
            targetArray[ ++j ] = val;
        };
    };
    return targetArray;
};
