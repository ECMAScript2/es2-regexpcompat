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
    if( CONST_SUPPORT_ES2018 ){
        this.names   = pattern.names;
        this.unicode = pattern.flagSet.unicode;
    };
};

/** Run compiler and return compiled `Program`.
 * 
 * @return {Program}
 */
Compiler.prototype.compile = function(){
    var codes0 = Compiler_compileNode( this, this.pattern.child );
    var codes1 = [
            { op: REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN, index: 0 }
        ].concat(
            /* ... */ /** @type {!Array.<!OpCode>} */ (codes0),
            { op: REGEXP_COMPAT__OPCODE_IS_CAP_END, index: 0 },
            { op: REGEXP_COMPAT__OPCODE_IS_MATCH }
        );
    return new Program( this.pattern, codes1 );
};

/**
 * @param {Compiler} compiler
 * @param {RegExpPaternNode} node 
 * @return {Array.<OpCode>|undefined}
 */
function Compiler_compileNode( compiler, node ){
    switch( node.type ){
        case REGEXP_COMPAT__PATTERN_IS_Disjunction :
            return Compiler_compileDisjunction( compiler, /** @type {Disjunction} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Sequence :
            return Compiler_compileSequence( compiler, /** @type {Sequence} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Capture :
            return Compiler_compileCapture( compiler, /** @type {Capture} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Group :
            return Compiler_compileGroup( compiler, /** @type {Group} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Many :
            return Compiler_compileMany( compiler, /** @type {Many} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Some :
            return Compiler_compileSome( compiler, /** @type {Some} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Optional :
            return Compiler_compileOptional( compiler, /** @type {Optional} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Repeat :
            return Compiler_compileRepeat( compiler, /** @type {Repeat} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_WordBoundary :
            return Compiler_compileWordBoundary( compiler, /** @type {WordBoundary} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_LineBegin :
            return Compiler_compileLineBegin( compiler /* node */ );
        case REGEXP_COMPAT__PATTERN_IS_LineEnd :
            return Compiler_compileLineEnd( compiler /* node */ );
        case REGEXP_COMPAT__PATTERN_IS_LookAhead :
            return Compiler_compileLookAhead( compiler, /** @type {LookAhead} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Char:
            return Compiler_compileChar( compiler, /** @type {Char} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_EscapeClass:
            return Compiler_compileEscapeClass( compiler, /** @type {EscapeClass} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Class :
            return Compiler_compileClass( compiler, /** @type {Class} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_Dot :
            return Compiler_compileDot( compiler /* node */ );
        case REGEXP_COMPAT__PATTERN_IS_BackRef :
            return Compiler_compileBackRef( compiler, /** @type {BackRef} */ (node) );
        case REGEXP_COMPAT__PATTERN_IS_NamedBackRef :
            if( CONST_SUPPORT_ES2018 ){
                return Compiler_compileNamedBackRef( compiler, /** @type {NamedBackRef} */ (node) );
            };
        case REGEXP_COMPAT__PATTERN_IS_NamedCapture :
            if( CONST_SUPPORT_ES2018 ){
                return Compiler_compileNamedCapture( compiler, /** @type {NamedCapture} */ (node) );
            };
        case REGEXP_COMPAT__PATTERN_IS_LookBehind :
            if( CONST_SUPPORT_ES2018 ){
                return Compiler_compileLookBehind( compiler, /** @type {LookBehind} */ (node) );
            };
    };
};

/**
 * @param {Compiler} compiler
 * @param {Disjunction} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileDisjunction( compiler, node ){
    var _children = node.children,
        l = _children.length;

    if( l === 0 && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: invalid pattern');
    };

    var children = [];
    var advance = true;

    for( var i = 0; i < l; ++i ){
        children.push( Compiler_compileNode( compiler, _children[ i ] ) );
        advance = advance && compiler.advance;
    };

    compiler.advance = advance;

    return /** @type {!Array.<!OpCode>} */ (Array_reduceRight( children, toOpCodeArray ));

    function toOpCodeArray( codes, codes0 ){
        return [
                { op: REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes0.length + 1 }
            ].concat(
                /* ... */ /** @type {!Array.<!OpCode>} */ (codes0),
                { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: codes.length },
                /* ... */ /** @type {!Array.<!OpCode>} */ (codes)
            );
    };
};

/**
 * @param {Compiler} compiler
 * @param {Sequence} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileSequence( compiler, node ){
    var children = Array_from( node.children );

    if( compiler.direction === Compiler_DIRECTION_BACKWARD ){
        children.reverse(); // Array.prototype.reverse IE4+
        /* if( false && children.reverse ){ // 
            children.reverse();
        } else {
            for( var i = 1, child, l = children.length; i < l; ++i ){ // for ie5
                child = children.pop();
                children.unshift( child );
            };
        }; */
    };

    var codes = [];
    var i = -1, child, codes0, l, k, j = -1;
    var advance = false;
    for( ; child = children[ ++i ]; ){
        codes0 = Compiler_compileNode( compiler, child );
        if( l = codes0.length ){
            for( k = 0; k < l; ++k ){
                codes[ ++j ] = codes0[ k ];
            };
        } else {
            codes[ ++j ] = codes0;
        };
        advance = advance || compiler.advance;
    };
    compiler.advance = advance;

    return codes;
};

/**
 * @param {Compiler} compiler
 * @param {Group} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileGroup( compiler, node ){
    return /** @type {!Array.<!OpCode>} */ ( Compiler_compileNode( compiler, node.child ) );
};

/**
 * @param {Compiler} compiler
 * @param {Capture} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileCapture( compiler, node ){
    var current = compiler.captureParensIndex++;
    var codes0  = Compiler_compileNode( compiler, node.child );

    if( node.index !== current ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid pattern');
        };
    };
    return [
            { op: compiler.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_CAP_END : REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN, index: current }
        ].concat(
            /* ... */ /** @type {!Array.<!OpCode>} */ (codes0),
            { op: compiler.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN : REGEXP_COMPAT__OPCODE_IS_CAP_END, index: current }
        );
};

/**
 * @param {Compiler} compiler
 * @param {NamedCapture} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileNamedCapture( compiler, node ){
    var current = compiler.captureParensIndex++;
    var codes0  = Compiler_compileNode( compiler, node.child );
    var index   = m_getCaptureGroupIndexByName( /** @type {!Array.<string|number>} */ (compiler.names), node.name );

    if( index === -1 || index !== current ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('BUG: invalid pattern');
        };
    };
    return [
            { op: REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN, index : index }
        ].concat(
            /* ... */ /** @type {!Array.<!OpCode>} */ (codes0),
            { op: REGEXP_COMPAT__OPCODE_IS_CAP_END, index : index }
        );
};

/**
 * @param {Compiler} compiler
 * @param {Many} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileMany( compiler, node ){
    var from = compiler.captureParensIndex;
    var codes0 = Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!OpCode>} */ (Compiler_compileNode( compiler, node.child )) );
    var codes1 = Compiler_insertCapReset( compiler, from, /** @type {!Array.<!OpCode>} */ (codes0) );
    compiler.advance = false;

    return [
            { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 1 }
        ].concat(
            /* ... */ codes1,
            { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: -1 - codes1.length - 1 }
        );
};

/**
 * @param {Compiler} compiler
 * @param {Some} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileSome( compiler, node ){
    var from = compiler.captureParensIndex;
    var codes0 = Compiler_compileNode( compiler, node.child );
    var codes1 = Compiler_insertCapReset( compiler, from, Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!OpCode>} */ (codes0 ) ) );

    return codes0.concat(
            { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 1 },
            /* ... */ codes1,
            { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: -1 - codes1.length - 1 }
        );
};

/**
 * @param {Compiler} compiler
 * @param {Optional} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileOptional( compiler, node ){
    var codes0 = Compiler_compileNode( compiler, node.child );
    compiler.advance = false;

    return [
            { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes0.length }
        ].concat(
            /* ... */ codes0
        );
};

/**
 * @param {Compiler} compiler
 * @param {Repeat} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileRepeat( compiler, node ){
    var from = compiler.captureParensIndex;
    var min  = node.min;
    var codes0 = Compiler_compileNode( compiler, node.child );
    var codes; // = [];
    var codes1;

    if( min === 1 ){
        codes = codes0; //.concat();
        // codes.push(...codes0);
    } else if( min > 1 ){
        codes1 = Compiler_insertCapReset( compiler, from, /** @type {!Array.<!OpCode>} */ (codes0) );
        codes = [
                { op: REGEXP_COMPAT__OPCODE_IS_PUSH, value: min }
            ].concat(
                /* ... */ codes1,
                { op: REGEXP_COMPAT__OPCODE_IS_DEC },
                { op: REGEXP_COMPAT__OPCODE_IS_LOOP, cont: -1 - codes1.length - 1 },
                { op: REGEXP_COMPAT__OPCODE_IS_POP }
            );
    } else {
        codes = [];
        compiler.advance = false;
    };

    var max = node.max != null ? node.max : min;
    if( max === Infinity ){
        codes1 = Compiler_insertCapReset( compiler, from, Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!OpCode>} */ (codes0) ) );
        codes =
            codes.concat(
                { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length + 1 }, // next: は (1) を指す
                /* ... */ codes1,
                { op: REGEXP_COMPAT__OPCODE_IS_JUMP, cont: -1 - codes1.length - 1 } // cont: は (1) を指す
            );
    } else if( max > min ){
        var remain = max - min;
        codes1 = Compiler_insertCapReset( compiler, from, Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!OpCode>} */ (codes0) ) );
        if( remain === 1 ){
            codes =
                codes.concat(
                    { op: node.nonGreedy ? REGEXP_COMPAT__OPCODE_IS_FORK_NEXT : REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes1.length }, // next: は (2) を指す
                    /* ... */ codes1 // (2)
                );
        } else {
            codes =
                codes.concat(
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

    return /** @type {!Array.<!OpCode>} */ (codes);
};

/**
 * @param {Compiler} compiler
 * @param {!Array.<!OpCode>} codes0 
 * @return {!Array.<!OpCode>}
 */
function Compiler_insertEmptyCheck( compiler, codes0 ){
    return compiler.advance ? codes0 : [
            { op: REGEXP_COMPAT__OPCODE_IS_PUSH_POS }
        ].concat(
            /* ... */ codes0,
            { op: REGEXP_COMPAT__OPCODE_IS_EMPTY_CHECK }
        );
};

/**
 * @param {Compiler} compiler
 * @param {number} from
 * @param {!Array.<!OpCode>} codes0 
 * @return {!Array.<!OpCode>}
 */
function Compiler_insertCapReset( compiler, from, codes0 ){
    if( from === compiler.captureParensIndex ){
        return codes0;
    };
    return [
            { op: REGEXP_COMPAT__OPCODE_IS_CAP_RESET, from : from, to: compiler.captureParensIndex }
        ].concat(
            /* ... */ codes0
        );
};

/**
 * @param {Compiler} compiler
 * @param {WordBoundary} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileWordBoundary( compiler, node ){
    compiler.advance = false;
    return [ { op: node.invert ? REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY_NOT : REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY } ];
};

/**
 * @param {Compiler} compiler
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileLineBegin( compiler ){
    compiler.advance = false;
    return [{ op: REGEXP_COMPAT__OPCODE_IS_LINE_BEGIN }];
};

/**
 * @param {Compiler} compiler
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileLineEnd( compiler ){
    compiler.advance = false;
    return [{ op: REGEXP_COMPAT__OPCODE_IS_LINE_END }];
};

/**
 * @param {Compiler} compiler
 * @param {LookAhead} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileLookAhead( compiler, node ){
    var oldDirection = compiler.direction;
    compiler.direction = Compiler_DIRECTION_FORWARD;
    var codes = Compiler_compileLookAround( compiler, node );
    compiler.direction = oldDirection;
    return codes;
};

/**
 * @param {Compiler} compiler
 * @param {LookBehind} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileLookBehind( compiler, node ){
    var oldDirection = compiler.direction;
    compiler.direction = Compiler_DIRECTION_BACKWARD;
    var codes = Compiler_compileLookAround( compiler, node );
    compiler.direction = oldDirection;
    return codes;
};

/**
 * @param {Compiler} compiler
 * @param {LookAhead|LookBehind} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileLookAround( compiler, node ){
    var codes0 = Compiler_compileNode( compiler, node.child );
    compiler.advance = false;

    if( node.negative ){
        return [
                { op: REGEXP_COMPAT__OPCODE_IS_PUSH_POS },
                { op: REGEXP_COMPAT__OPCODE_IS_PUSH_PROC },
                { op: REGEXP_COMPAT__OPCODE_IS_FORK_CONT, next: codes0.length + 2 }
            ].concat(
                /* ... */ /** @type {!Array.<!OpCode>} */ (codes0),
                { op: REGEXP_COMPAT__OPCODE_IS_REWIND_PROC },
                { op: REGEXP_COMPAT__OPCODE_IS_FAIL },
                { op: REGEXP_COMPAT__OPCODE_IS_POP },
                { op: REGEXP_COMPAT__OPCODE_IS_RESTORE_POS }
            );
    };

    return [
            { op: REGEXP_COMPAT__OPCODE_IS_PUSH_POS },
            { op: REGEXP_COMPAT__OPCODE_IS_PUSH_PROC }
        ].concat(
            /* ... */ /** @type {!Array.<!OpCode>} */ (codes0),
            { op: REGEXP_COMPAT__OPCODE_IS_REWIND_PROC },
            { op: REGEXP_COMPAT__OPCODE_IS_RESTORE_POS }
        );
};

/**
 * @param {Compiler} compiler
 * @param {Char} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileChar( compiler, node ){
    var value = node.value;
    if( compiler.ignoreCase ){
        value = CONST_SUPPORT_ES2018 ? canonicalize( value, compiler.unicode ) : canonicalize( value );
    };
    compiler.advance = true;
    return Compiler_insertBack( compiler, [ { op: REGEXP_COMPAT__OPCODE_IS_CHAR, value : value } ] );
};

/**
 * @param {Compiler} compiler
 * @param {EscapeClass} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileEscapeClass( compiler, node ){
    var set = Compiler_escapeClassToSet( compiler, node );
    compiler.advance = true;
    return Compiler_insertBack( compiler, [ { op: REGEXP_COMPAT__OPCODE_IS_CLASS, set : set } ] );
};

/**
 * @param {Compiler} compiler
 * @param {Class} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileClass( compiler, node ){
    var set = m_createCharSetFromArray( [] ),
        classItemList = node.children;

    for( var /** @type {ClassItem} */ item, i = -1; item = classItemList[ ++i ]; ){
        switch( item.type ){
            case REGEXP_COMPAT__PATTERN_IS_Char :
                set.add( item.value, item.value + 1 );
                break;
            case REGEXP_COMPAT__PATTERN_IS_EscapeClass :
                set.addCharSet( Compiler_escapeClassToSet( compiler, /** @type {EscapeClass} */ (item) ) );
                break;
            case REGEXP_COMPAT__PATTERN_IS_ClassRange :
                set.add( item.children[ 0 ].value, item.children[ 1 ].value + 1 );
                break;
        };
    };
    compiler.advance = true;
    return Compiler_insertBack( compiler, [ { op: node.invert ? REGEXP_COMPAT__OPCODE_IS_CLASS_NOT : REGEXP_COMPAT__OPCODE_IS_CLASS, set : set } ] );
};

/**
 * @param {Compiler} compiler
 * @param {EscapeClass} _node 
 * @return {CharSet|undefined}
 */
function Compiler_escapeClassToSet( compiler, _node ){
    var node;

    switch( _node.kind ){
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_digit :
            node = /** @type {SimpleEscapeClass} */ ( _node );
            return node.invert ? m_charSetInvertDigit : m_charSetDigit;
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_word :
            node = /** @type {SimpleEscapeClass} */ ( _node );
            if( CONST_SUPPORT_ES2018 ){
                if( compiler.unicode && compiler.ignoreCase ){
                    return node.invert ? m_charSetInvertUnicodeWord : m_charSetUnicodeWord;
                };
            };
            return node.invert ? m_charSetInvertWord : m_charSetWord;
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_space :
            node = /** @type {SimpleEscapeClass} */ ( _node );
            return node.invert ? m_charSetInvertSpace : m_charSetSpace;
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property :
            if( CONST_SUPPORT_ES2018 ){
                node = /** @type {UnicodePropertyEscapeClass} */ ( _node );
                var set = m_loadCategory( node.property ) || m_loadProperty( node.property );
                
                if( !set && DEFINE_REGEXP_COMPAT__DEBUG ){
                    throw new RegExpSyntaxError( 'invalid Unicode property' );
                };
                return node.invert ? set.clone().invert() : set;
            };
        case REGEXP_COMPAT__ESCAPE_CLASS_KIND_IS_unicode_property_value :
            if( CONST_SUPPORT_ES2018 ){
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
 * @param {Compiler} compiler
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileDot( compiler ){
    compiler.advance = true;
    return Compiler_insertBack( compiler, [ { op : REGEXP_COMPAT__OPCODE_IS_ANY } ] );
};

/**
 * @param {Compiler} compiler
 * @param {!Array.<!OpCode>} codes 
 * @return {!Array.<!OpCode>}
 */
function Compiler_insertBack( compiler, codes ){
    if( compiler.direction === Compiler_DIRECTION_FORWARD ){
        return codes;
    };
    return [
            { op: REGEXP_COMPAT__OPCODE_IS_BACK }
        ].concat(
            /* ... */ codes,
            { op: REGEXP_COMPAT__OPCODE_IS_BACK }
        );
};

/**
 * @param {Compiler} compiler
 * @param {BackRef} node 
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileBackRef( compiler, node ){
    if( node.index < 1 || compiler.captureParens < node.index ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('invalid back reference');
        };
    };
    compiler.advance = false;
    return [ { op: compiler.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_REF_BACK : REGEXP_COMPAT__OPCODE_IS_REF, index : node.index } ];
};

/**
 * @param {Compiler} compiler
 * @param {NamedBackRef} node
 * @return {!Array.<!OpCode>}
 */
function Compiler_compileNamedBackRef( compiler, node ){
    var index = m_getCaptureGroupIndexByName( /** @type {!Array.<string|number>} */ (compiler.names), node.name );

    if( index === -1 || index < 1 || compiler.captureParens < index ){
        if( DEFINE_REGEXP_COMPAT__DEBUG ){
            throw new Error('invalid named back reference');
        };
    };
    compiler.advance = false;
    return [ { op: compiler.direction === Compiler_DIRECTION_BACKWARD ? REGEXP_COMPAT__OPCODE_IS_REF_BACK : REGEXP_COMPAT__OPCODE_IS_REF, index : index } ];
};

if( DEFINE_REGEXP_COMPAT__NODEJS ){
    module[ 'exports' ][ 'Compiler' ] = Compiler;
};
