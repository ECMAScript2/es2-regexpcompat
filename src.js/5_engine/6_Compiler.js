/** `Compiler` is a compiler for `Pattern` to `Program`.
 * @constructor
 * @param {Pattern} pattern 
 */
function Compiler( pattern ){
    this.advance = false;
    this.captureParensIndex = 1;
    this.direction = 'forward';
    this.pattern = pattern;

    this.ignoreCase = pattern.flagSet.ignoreCase;
    this.unicode    = pattern.flagSet.unicode;
    this.captureParens = pattern.captureParens;
    this.names = pattern.names;
};

/** Run compiler and return compiled `Program`.
 * 
 * @return {Program}
 */
Compiler.prototype.compile = function(){
    const codes0 = this.compileNode( this.pattern.child );
    const codes1 = Compiler_spreadOperator(
        { op: 'cap_begin', index: 0 },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: 'cap_end', index: 0 },
        { op: 'match' }
    );
    return new Program( this.pattern, codes1 );
};

/**
 * @param {RegExpPaternNode} node 
 * @return {Array.<OpCode>|undefined}
 */
Compiler.prototype.compileNode = function( node ){
    switch( node.type ){
        case 'Disjunction':
            return this.compileDisjunction( /** @type {Disjunction} */ (node) );
        case 'Sequence':
            return this.compileSequence( /** @type {Sequence} */ (node) );
        case 'Capture':
            return this.compileCapture( /** @type {Capture} */ (node) );
        case 'NamedCapture':
            return this.compileNamedCapture( /** @type {NamedCapture} */ (node) );
        case 'Group':
            return this.compileGroup( /** @type {Group} */ (node) );
        case 'Many':
            return this.compileMany( /** @type {Many} */ (node) );
        case 'Some':
            return this.compileSome( /** @type {Some} */ (node) );
        case 'Optional':
            return this.compileOptional( /** @type {Optional} */ (node) );
        case 'Repeat':
            return this.compileRepeat( /** @type {Repeat} */ (node) );
        case 'WordBoundary':
            return this.compileWordBoundary( /** @type {WordBoundary} */ (node) );
        case 'LineBegin':
            return this.compileLineBegin( /* node */ );
        case 'LineEnd':
            return this.compileLineEnd( /* node */ );
        case 'LookAhead':
            return this.compileLookAhead( /** @type {LookAhead} */ (node) );
        case 'LookBehind':
            return this.compileLookBehind( /** @type {LookBehind} */ (node) );
        case 'Char':
            return this.compileChar( /** @type {Char} */ (node) );
        case 'EscapeClass':
            return this.compileEscapeClass( /** @type {EscapeClass} */ (node) );
        case 'Class':
            return this.compileClass( /** @type {Class} */ (node) );
        case 'Dot':
            return this.compileDot( /* node */ );
        case 'BackRef':
            return this.compileBackRef( /** @type {BackRef} */ (node) );
        case 'NamedBackRef':
            return this.compileNamedBackRef( /** @type {NamedBackRef} */ (node) );
    };
};

/**
 * @param {Disjunction} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileDisjunction = function( node ){
    const _children = node.children,
          l = _children.length;

    if( l === 0 ){
        throw new Error('BUG: invalid pattern');
    };

    const children = [];
    let advance = true;

    for( let i = 0; i < l; ++i ){
        children.push( this.compileNode( _children[ i ] ) );
        advance = advance && this.advance;
    };

    this.advance = advance;

    return /** @type {Array.<OpCode>} */ (Array_reduceRight( children, toOpCodeArray ));

    function toOpCodeArray( codes, codes0 ){
        return Compiler_spreadOperator(
            { op: 'fork_cont', next: codes0.length + 1 },
            /* ... */ /** @type {Array.<OpCode>} */ (codes0),
            { op: 'jump', cont: codes.length },
            /* ... */ /** @type {Array.<OpCode>} */ (codes),
        );
    };
};

/**
 * @param {Sequence} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileSequence = function( node ){
    const children = Array_from( node.children );

    if( this.direction === 'backward' ){
        if( false || children.reverse ){
            children.reverse();
        } else {
            for( var i = 1, child, l = children.length; i < l; ++i ){ // for ie5
                child = children.pop();
                children.unshift( child );
            };
        };
    };

    const codes = [];
    let advance = false;
    for( let i = -1, child; child = children[ ++i ]; ){
        const codes0 = this.compileNode( child );
        Compiler_pushElementsToOpCodeList( codes, /** @type {Array.<OpCode>} */ (codes0) );
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
    return this.compileNode( node.child );
};

/**
 * @param {Capture} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileCapture = function( node ){
    const codes0 = this.compileNode( node.child );

    if( node.index !== this.captureParensIndex++ ){
        throw new Error('BUG: invalid pattern');
    };
    return Compiler_spreadOperator(
        { op: this.direction === 'backward' ? 'cap_end' : 'cap_begin', index: node.index },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: this.direction === 'backward' ? 'cap_begin' : 'cap_end', index: node.index },
    );
};

/**
 * @param {NamedCapture} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileNamedCapture = function( node ){
    const codes0 = this.compileNode( node.child );
    const index = this.names.get( node.name );

    if( index === undefined || index !== this.captureParensIndex++ ){
        throw new Error('BUG: invalid pattern');
    };
    return Compiler_spreadOperator(
        { op: 'cap_begin', index },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: 'cap_end', index }
    );
};

/**
 * @param {Many} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileMany = function( node ){
    const from = this.captureParensIndex;
    const codes0 = this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (this.compileNode( node.child )) );
    const codes1 = this.insertCapReset( from, /** @type {Array.<OpCode>} */ (codes0) );
    this.advance = false;

    return Compiler_spreadOperator(
        { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length + 1 },
        /* ... */ codes1,
        { op: 'jump', cont: -1 - codes1.length - 1 }
    );
};

/**
 * @param {Some} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileSome = function( node ){
    const from = this.captureParensIndex;
    const codes0 = this.compileNode( node.child );
    const codes1 = this.insertCapReset( from, this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (codes0 ) ) );

    return Compiler_spreadOperator(
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length + 1 },
        /* ... */ codes1,
        { op: 'jump', cont: -1 - codes1.length - 1 }
    );
};

/**
 * @param {Optional} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileOptional = function( node ){
    const codes0 = this.compileNode( node.child );
    this.advance = false;

    return Compiler_spreadOperator(
        { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes0.length },
        /* ... */ codes0
    );
};

/**
 * @param {Repeat} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileRepeat = function( node ){
    const from = this.captureParensIndex;
    const codes0 = this.compileNode( node.child );
    const codes = [];

    if( node.min === 1 ){
        Compiler_pushElementsToOpCodeList( codes, /** @type {Array.<OpCode>} */ (codes0) );
        // codes.push(...codes0);
    } else if( node.min > 1 ){
        const codes1 = this.insertCapReset( from, /** @type {Array.<OpCode>} */ (codes0) );
        Compiler_pushElementsToOpCodeList(
            codes,
            { op: 'push', value: node.min },
            /* ... */ codes1,
            { op: 'dec' },
            { op: 'loop', cont: -1 - codes1.length - 1 },
            { op: 'pop' }
        );
    } else {
        this.advance = false;
    };

    const max = node.max != null ? node.max : node.min;
    if( max === Infinity ){
        const codes1 = this.insertCapReset( from, this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (codes0) ) );
        Compiler_pushElementsToOpCodeList(
            codes,
            { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length + 1 },
            /* ... */ codes1,
            { op: 'jump', cont: -1 - codes1.length - 1 }
        );
    } else if( max > node.min ){
        const remain = max - node.min;
        const codes1 = this.insertCapReset( from, this.insertEmptyCheck( /** @type {Array.<OpCode>} */ (codes0) ) );
        if( remain === 1 ){
            Compiler_pushElementsToOpCodeList(
                codes,
                { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length },
                /* ... */ codes1
            );
        } else {
            Compiler_pushElementsToOpCodeList(
                codes,
                { op: 'push', value: remain + 1 },
                { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes0.length + 4 },
                /* ... */ codes1,
                { op: 'dec' },
                { op: 'loop', cont: -1 - codes0.length - 2 },
                { op: 'fail' },
                { op: 'pop' }
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
    return this.advance ? codes0 : Compiler_spreadOperator(
        { op: 'push_pos' },
        /* ... */ codes0,
        { op: 'empty_check' }
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
    return Compiler_spreadOperator(
        { op: 'cap_reset', from, to: this.captureParensIndex },
        /* ... */ codes0
    );
};

/**
 * @param {WordBoundary} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileWordBoundary = function( node ){
    this.advance = false;
    return [{ op: node.invert ? 'word_boundary_not' : 'word_boundary' }];
};

/**
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLineBegin = function( /* _node */ ){
    this.advance = false;
    return [{ op: 'line_begin' }];
};

/**
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLineEnd = function( /* _node */ ){
    this.advance = false;
    return [{ op: 'line_end' }];
};

/**
 * @param {LookAhead} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLookAhead = function( node ){
    const oldDirection = this.direction;
    this.direction = 'forward';
    const codes = this.compileLookAround( node );
    this.direction = oldDirection;
    return codes;
};

/**
 * @param {LookBehind} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLookBehind = function( node ){
    const oldDirection = this.direction;
    this.direction = 'backward';
    const codes = this.compileLookAround( node );
    this.direction = oldDirection;
    return codes;
};

/**
 * @param {LookAhead|LookBehind} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileLookAround = function( node ){
    const codes0 = this.compileNode( node.child );
    this.advance = false;

    if( node.negative ){
        return Compiler_spreadOperator(
            { op: 'push_pos' },
            { op: 'push_proc' },
            { op: 'fork_cont', next: codes0.length + 2 },
            /* ... */ /** @type {Array.<OpCode>} */ (codes0),
            { op: 'rewind_proc' },
            { op: 'fail' },
            { op: 'pop' },
            { op: 'restore_pos' }
        );
    };

    return Compiler_spreadOperator(
        { op: 'push_pos' },
        { op: 'push_proc' },
        /* ... */ /** @type {Array.<OpCode>} */ (codes0),
        { op: 'rewind_proc' },
        { op: 'restore_pos' }
    );
};

/**
 * @param {Char} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileChar = function( node ){
    let value = node.value;
    if( this.ignoreCase ){
        value = canonicalize( value, this.unicode );
    };
    this.advance = true;
    return this.insertBack( [ { op: 'char', value } ] );
};

/**
 * @param {EscapeClass} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileEscapeClass = function( node ){
    const set = this.escapeClassToSet( node );
    this.advance = true;
    return this.insertBack( [ { op: 'class', set : set } ] );
};

/**
 * @param {Class} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileClass = function( node ){
    const set = new CharSet(),
          classItemList = node.children;

    for( let /** @type {ClassItem} */ item, i = -1; item = classItemList[ ++i ]; ){
        switch( item.type ){
            case 'Char':
                set.add( item.value, item.value + 1 );
                break;
            case 'EscapeClass':
                var casted = /** @type {EscapeClass} */ ( item );
                set.addCharSet( this.escapeClassToSet( casted ) );
                break;
            case 'ClassRange':
                set.add( item.children[ 0 ].value, item.children[ 1 ].value + 1 );
                break;
        };
    };
    this.advance = true;
    return this.insertBack( [ { op: node.invert ? 'class_not' : 'class', set } ] );
};

/**
 * @param {EscapeClass} _node 
 * @return {CharSet|undefined}
 */
Compiler.prototype.escapeClassToSet = function( _node ){
    var node;

    switch( _node.kind ){
        case 'digit':
            node = /** @type {SimpleEscapeClass} */ ( _node );
            return node.invert ? charSetInvertDigit : charSetDigit;
        case 'word':
            node = /** @type {SimpleEscapeClass} */ ( _node );
            if( this.unicode && this.ignoreCase ){
                return node.invert ? charSetInvertUnicodeWord : charSetUnicodeWord;
            };
            return node.invert ? charSetInvertWord : charSetWord;
        case 'space':
            node = /** @type {SimpleEscapeClass} */ ( _node );
            return node.invert ? charSetInvertSpace : charSetSpace;
        case 'unicode_property':
            node = /** @type {UnicodePropertyEscapeClass} */ ( _node );
            var set = loadPropertyValue( 'General_Category', node.property ) || loadProperty( node.property );
            
            if( !set ){
                throw new RegExpSyntaxError( 'invalid Unicode property' );
            };
            return node.invert ? set.clone().invert() : set;
        case 'unicode_property_value':
            node = /** @type {UnicodePropertyValueEscapeClass} */ ( _node );
            var set = loadPropertyValue( node.property, node.value );

            if( set === null ){
                throw new RegExpSyntaxError( 'invalid Unicode property value' );
            };
            return node.invert ? set.clone().invert() : set;
    };
};

/**
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileDot = function( /* _node */ ){
    this.advance = true;
    return this.insertBack( [ { op: 'any' } ] );
};

/**
 * @param {Array.<OpCode>} codes 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.insertBack = function( codes ){
    if( this.direction === 'forward' ){
        return codes;
    };
    return Compiler_spreadOperator(
        { op: 'back' },
        /* ... */ codes,
        { op: 'back' }
    );
};

/**
 * @param {BackRef} node 
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileBackRef = function( node ){
    if( node.index < 1 || this.captureParens < node.index ){
        throw new Error('invalid back reference');
    };
    this.advance = false;
    return [ { op: this.direction === 'backward' ? 'ref_back' : 'ref', index: node.index } ];
};

/**
 * @param {NamedBackRef} node
 * @return {Array.<OpCode>}
 */
Compiler.prototype.compileNamedBackRef = function( node ){
    const index = this.names.get( node.name );

    if( index === undefined || index < 1 || this.captureParens < index ){
        throw new Error('invalid named back reference');
    };
    this.advance = false;
    return [ { op: this.direction === 'backward' ? 'ref_back' : 'ref', index } ];
};

/**
 * @param {...(OpCode|Array.<OpCode>)} _args
 * @return {Array.<OpCode>}
 */
function Compiler_spreadOperator( ..._args /* ... */ ){
    var args   = arguments,
        l      = args.length,
        i      = 0,
        j      = -1,
        result = [],
        val;

    for( ; i < l; ++i ){
        val = args[ i ];
        if( val && val.pop ){ // isArray
            for( var k = 0, m = val.length; k < m; ++k ){
                result[ ++j ] = val[ k ];
            };
        } else {
            result[ ++j ] = val;
        };
    };
    return result;
};

/**
 * @param {Array.<OpCode>} targetArray
 * @param {...(OpCode|Array.<OpCode>)} _args
 * @return {Array.<OpCode>}
 */
function Compiler_pushElementsToOpCodeList( targetArray, ..._args /*, ... */ ){
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
