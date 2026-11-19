goog.provide( 'vm.Compiler' );

goog.requireType( 'vm.d.FlagSet' );
goog.requireType( 'vm.d.CharSet' );
goog.require( 'vm.Program' );
goog.require( 'vm.charSet.Digit' );
goog.require( 'vm.charSet.InvertDigit' );
goog.require( 'vm.charSet.Word' );
goog.require( 'vm.charSet.InvertWord' );
goog.require( 'vm.charSet.UnicodeWord' );
goog.require( 'vm.charSet.InvertUnicodeWord' );
goog.require( 'vm.charSet.Space' );
goog.require( 'vm.charSet.InvertSpace' );
goog.require( 'vm.d.OpCode' );
goog.require( 'vm.RegExpSyntaxError' );
goog.require( 'vm.loadCategory' );
goog.require( 'vm.loadProperty' );
goog.require( 'vm.loadPropertyValue' );
goog.require( 'vm.canonicalize' );

goog.scope(
    function(){
        vm.Compiler = Compiler;

        var _DIRECTION_FORWARD  = vm.DEFINE.MINIFY ? 1 : 'forward',
            _DIRECTION_BACKWARD = vm.DEFINE.MINIFY ? 2 : 'backward';

        /** `Compiler` is a compiler for `Pattern` to `Program`.
         * @constructor
         * @param {!Pattern} pattern */
        function Compiler( pattern ){
            this.advance            = false;
            this.captureParensIndex = 1;
            this.direction          = _DIRECTION_FORWARD;
            this.pattern            = pattern;
            this.ignoreCase         = pattern.flagSet.ignoreCase;
            this.captureParens      = pattern.captureParens;
            if( vm.SUPPORT_ES2018 ){
                this.names   = pattern.names;
                this.unicode = pattern.flagSet.unicode;
            };
        };

        /** Run compiler and return compiled `Program`.
         * 
         * @return {!vm.Program} */
        Compiler.prototype.compile = function(){
            var codes0 = Compiler_compileNode( this, this.pattern.child );
            var codes1 = [
                    { op: vm.EnumOpCode.CAP_BEGIN, index: 0 }
                ].concat(
                    /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes0),
                    { op: vm.EnumOpCode.CAP_END, index: 0 },
                    { op: vm.EnumOpCode.MATCH }
                );
            return new vm.Program( this.pattern, codes1 );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!RegExpPaternNode} node 
         * @return {!Array.<!vm.d.OpCode> | void} */
        function Compiler_compileNode( compiler, node ){
            switch( node.type ){
                case vm.EnumPattern.Disjunction :
                    return Compiler_compileDisjunction( compiler, /** @type {!Disjunction} */ (node) );
                case vm.EnumPattern.Sequence :
                    return Compiler_compileSequence( compiler, /** @type {!Sequence} */ (node) );
                case vm.EnumPattern.Capture :
                    return Compiler_compileCapture( compiler, /** @type {!Capture} */ (node) );
                case vm.EnumPattern.Group :
                    return Compiler_compileGroup( compiler, /** @type {!Group} */ (node) );
                case vm.EnumPattern.Many :
                    return Compiler_compileMany( compiler, /** @type {!Many} */ (node) );
                case vm.EnumPattern.Some :
                    return Compiler_compileSome( compiler, /** @type {!Some} */ (node) );
                case vm.EnumPattern.Optional :
                    return Compiler_compileOptional( compiler, /** @type {!Optional} */ (node) );
                case vm.EnumPattern.Repeat :
                    return Compiler_compileRepeat( compiler, /** @type {!Repeat} */ (node) );
                case vm.EnumPattern.WordBoundary :
                    return Compiler_compileWordBoundary( compiler, /** @type {!WordBoundary} */ (node) );
                case vm.EnumPattern.LineBegin :
                    return Compiler_compileLineBegin( compiler /* node */ );
                case vm.EnumPattern.LineEnd :
                    return Compiler_compileLineEnd( compiler /* node */ );
                case vm.EnumPattern.LookAhead :
                    return Compiler_compileLookAhead( compiler, /** @type {!LookAhead} */ (node) );
                case vm.EnumPattern.Char:
                    return Compiler_compileChar( compiler, /** @type {!Char} */ (node) );
                case vm.EnumPattern.EscapeClass:
                    return Compiler_compileEscapeClass( compiler, /** @type {!EscapeClass} */ (node) );
                case vm.EnumPattern.Class :
                    return Compiler_compileClass( compiler, /** @type {!Class} */ (node) );
                case vm.EnumPattern.Dot :
                    return Compiler_compileDot( compiler /* node */ );
                case vm.EnumPattern.BackRef :
                    return Compiler_compileBackRef( compiler, /** @type {!BackRef} */ (node) );
                case vm.EnumPattern.NamedBackRef :
                    if( vm.SUPPORT_ES2018 ){
                        return Compiler_compileNamedBackRef( compiler, /** @type {!NamedBackRef} */ (node) );
                    };
                case vm.EnumPattern.NamedCapture :
                    if( vm.SUPPORT_ES2018 ){
                        return Compiler_compileNamedCapture( compiler, /** @type {!NamedCapture} */ (node) );
                    };
                case vm.EnumPattern.LookBehind :
                    if( vm.SUPPORT_ES2018 ){
                        return Compiler_compileLookBehind( compiler, /** @type {!LookBehind} */ (node) );
                    };
            };
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Disjunction} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileDisjunction( compiler, node ){
            var _children = node.children,
                l = _children.length;

            if( l === 0 && vm.DEFINE.DEBUG ){
                throw new Error('BUG: invalid pattern');
            };

            var children = [];
            var advance = true;

            for( var i = 0; i < l; ++i ){
                children.push( Compiler_compileNode( compiler, _children[ i ] ) );
                advance = advance && compiler.advance;
            };

            compiler.advance = advance;

            return /** @type {!Array.<!vm.d.OpCode>} */ (vm.shim.ary.reduceRight( children, toOpCodeArray ));

            function toOpCodeArray( codes, codes0 ){
                return [
                        { op: vm.EnumOpCode.FORK_CONT, next: codes0.length + 1 }
                    ].concat(
                        /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes0),
                        { op: vm.EnumOpCode.JUMP, cont: codes.length },
                        /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes)
                    );
            };
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Sequence} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileSequence( compiler, node ){
            var children = vm.shim.ary.from( node.children );

            if( compiler.direction === _DIRECTION_BACKWARD ){
                children.reverse(); // Array.prototype.reverse IE4+
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
         * @param {!Compiler} compiler
         * @param {!Group} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileGroup( compiler, node ){
            return /** @type {!Array.<!vm.d.OpCode>} */ ( Compiler_compileNode( compiler, node.child ) );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Capture} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileCapture( compiler, node ){
            var current = compiler.captureParensIndex++;
            var codes0  = Compiler_compileNode( compiler, node.child );

            if( node.index !== current ){
                if( vm.DEFINE.DEBUG ){
                    throw new Error('BUG: invalid pattern');
                };
            };
            return [
                    { op: compiler.direction === _DIRECTION_BACKWARD ? vm.EnumOpCode.CAP_END : vm.EnumOpCode.CAP_BEGIN, index: current }
                ].concat(
                    /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes0),
                    { op: compiler.direction === _DIRECTION_BACKWARD ? vm.EnumOpCode.CAP_BEGIN : vm.EnumOpCode.CAP_END, index: current }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!NamedCapture} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileNamedCapture( compiler, node ){
            var current = compiler.captureParensIndex++;
            var codes0  = Compiler_compileNode( compiler, node.child );
            var index   = vm.getCaptureGroupIndexByName( /** @type {!Array.<string | number>} */ (compiler.names), node.name );

            if( index === -1 || index !== current ){
                if( vm.DEFINE.DEBUG ){
                    throw new Error('BUG: invalid pattern');
                };
            };
            return [
                    { op: vm.EnumOpCode.CAP_BEGIN, index : index }
                ].concat(
                    /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes0),
                    { op: vm.EnumOpCode.CAP_END, index : index }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Many} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileMany( compiler, node ){
            var from = compiler.captureParensIndex;
            var codes0 = Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!vm.d.OpCode>} */ (Compiler_compileNode( compiler, node.child )) );
            var codes1 = Compiler_insertCapReset( compiler, from, /** @type {!Array.<!vm.d.OpCode>} */ (codes0) );
            compiler.advance = false;

            return [
                    { op: node.nonGreedy ? vm.EnumOpCode.FORK_NEXT : vm.EnumOpCode.FORK_CONT, next: codes1.length + 1 }
                ].concat(
                    /* ... */ codes1,
                    { op: vm.EnumOpCode.JUMP, cont: -1 - codes1.length - 1 }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Some} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileSome( compiler, node ){
            var from = compiler.captureParensIndex;
            var codes0 = Compiler_compileNode( compiler, node.child );
            var codes1 = Compiler_insertCapReset( compiler, from, Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!vm.d.OpCode>} */ (codes0 ) ) );

            return codes0.concat(
                    { op: node.nonGreedy ? vm.EnumOpCode.FORK_NEXT : vm.EnumOpCode.FORK_CONT, next: codes1.length + 1 },
                    /* ... */ codes1,
                    { op: vm.EnumOpCode.JUMP, cont: -1 - codes1.length - 1 }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Optional} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileOptional( compiler, node ){
            var codes0 = Compiler_compileNode( compiler, node.child );
            compiler.advance = false;

            return [
                    { op: node.nonGreedy ? vm.EnumOpCode.FORK_NEXT : vm.EnumOpCode.FORK_CONT, next: codes0.length }
                ].concat(
                    /* ... */ codes0
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Repeat} node 
         * @return {!Array.<!vm.d.OpCode>} */
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
                codes1 = Compiler_insertCapReset( compiler, from, /** @type {!Array.<!vm.d.OpCode>} */ (codes0) );
                codes = [
                        { op: vm.EnumOpCode.PUSH, value: min }
                    ].concat(
                        /* ... */ codes1,
                        { op: vm.EnumOpCode.DEC },
                        { op: vm.EnumOpCode.LOOP, cont: -1 - codes1.length - 1 },
                        { op: vm.EnumOpCode.POP }
                    );
            } else {
                codes = [];
                compiler.advance = false;
            };

            var max = node.max != null ? node.max : min;
            if( max === Infinity ){
                codes1 = Compiler_insertCapReset( compiler, from, Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!vm.d.OpCode>} */ (codes0) ) );
                codes =
                    codes.concat(
                        { op: node.nonGreedy ? vm.EnumOpCode.FORK_NEXT : vm.EnumOpCode.FORK_CONT, next: codes1.length + 1 }, // next: は (1) を指す
                        /* ... */ codes1,
                        { op: vm.EnumOpCode.JUMP, cont: -1 - codes1.length - 1 } // cont: は (1) を指す
                    );
            } else if( max > min ){
                var remain = max - min;
                codes1 = Compiler_insertCapReset( compiler, from, Compiler_insertEmptyCheck( compiler, /** @type {!Array.<!vm.d.OpCode>} */ (codes0) ) );
                if( remain === 1 ){
                    codes =
                        codes.concat(
                            { op: node.nonGreedy ? vm.EnumOpCode.FORK_NEXT : vm.EnumOpCode.FORK_CONT, next: codes1.length }, // next: は (2) を指す
                            /* ... */ codes1 // (2)
                        );
                } else {
                    codes =
                        codes.concat(
                            { op: vm.EnumOpCode.PUSH, value: remain + 1 }, // (3)
                            { op: node.nonGreedy ? vm.EnumOpCode.FORK_NEXT : vm.EnumOpCode.FORK_CONT, next: codes1.length + 4 }, // next: は (4) を指す
                            /* ... */ codes1,
                            { op: vm.EnumOpCode.DEC },
                            { op: vm.EnumOpCode.LOOP, cont: -1 - codes1.length - 2 }, // cont: は (3) を指す
                            { op: vm.EnumOpCode.FAIL },
                            { op: vm.EnumOpCode.POP } // (4)
                        );
                };
            };

            return /** @type {!Array.<!vm.d.OpCode>} */ (codes);
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Array.<!vm.d.OpCode>} codes0 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_insertEmptyCheck( compiler, codes0 ){
            return compiler.advance ? codes0 : [
                    { op: vm.EnumOpCode.PUSH_POS }
                ].concat(
                    /* ... */ codes0,
                    { op: vm.EnumOpCode.EMPTY_CHECK }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {number} from
         * @param {!Array.<!vm.d.OpCode>} codes0 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_insertCapReset( compiler, from, codes0 ){
            if( from === compiler.captureParensIndex ){
                return codes0;
            };
            return [
                    { op: vm.EnumOpCode.CAP_RESET, from : from, to: compiler.captureParensIndex }
                ].concat(
                    /* ... */ codes0
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!WordBoundary} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileWordBoundary( compiler, node ){
            compiler.advance = false;
            return [ { op: node.invert ? vm.EnumOpCode.WORD_BOUNDARY_NOT : vm.EnumOpCode.WORD_BOUNDARY } ];
        };

        /**
         * @param {!Compiler} compiler
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileLineBegin( compiler ){
            compiler.advance = false;
            return [{ op: vm.EnumOpCode.LINE_BEGIN }];
        };

        /**
         * @param {!Compiler} compiler
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileLineEnd( compiler ){
            compiler.advance = false;
            return [{ op: vm.EnumOpCode.LINE_END }];
        };

        /**
         * @param {!Compiler} compiler
         * @param {!LookAhead} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileLookAhead( compiler, node ){
            var oldDirection = compiler.direction;
            compiler.direction = _DIRECTION_FORWARD;
            var codes = Compiler_compileLookAround( compiler, node );
            compiler.direction = oldDirection;
            return codes;
        };

        /**
         * @param {!Compiler} compiler
         * @param {!LookBehind} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileLookBehind( compiler, node ){
            var oldDirection = compiler.direction;
            compiler.direction = _DIRECTION_BACKWARD;
            var codes = Compiler_compileLookAround( compiler, node );
            compiler.direction = oldDirection;
            return codes;
        };

        /**
         * @param {!Compiler} compiler
         * @param {!LookAhead|!LookBehind} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileLookAround( compiler, node ){
            var codes0 = Compiler_compileNode( compiler, node.child );
            compiler.advance = false;

            if( node.negative ){
                return [
                        { op: vm.EnumOpCode.PUSH_POS },
                        { op: vm.EnumOpCode.PUSH_PROC },
                        { op: vm.EnumOpCode.FORK_CONT, next: codes0.length + 2 }
                    ].concat(
                        /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes0),
                        { op: vm.EnumOpCode.REWIND_PROC },
                        { op: vm.EnumOpCode.FAIL },
                        { op: vm.EnumOpCode.POP },
                        { op: vm.EnumOpCode.RESTORE_POS }
                    );
            };

            return [
                    { op: vm.EnumOpCode.PUSH_POS },
                    { op: vm.EnumOpCode.PUSH_PROC }
                ].concat(
                    /* ... */ /** @type {!Array.<!vm.d.OpCode>} */ (codes0),
                    { op: vm.EnumOpCode.REWIND_PROC },
                    { op: vm.EnumOpCode.RESTORE_POS }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Char} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileChar( compiler, node ){
            var value = node.value;
            if( compiler.ignoreCase ){
                value = vm.SUPPORT_ES2018 ? vm.canonicalize( value, compiler.unicode ) : vm.canonicalize( value );
            };
            compiler.advance = true;
            return Compiler_insertBack( compiler, [ { op: vm.EnumOpCode.CHAR, value : value } ] );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!EscapeClass} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileEscapeClass( compiler, node ){
            var set = Compiler_escapeClassToSet( compiler, node );
            compiler.advance = true;
            return Compiler_insertBack( compiler, [ { op: vm.EnumOpCode.CLASS, set : set } ] );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Class} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileClass( compiler, node ){
            var set = vm.createCharSet( [] ),
                classItemList = node.children;

            for( var /** @type {!ClassItem} */ item, i = -1; item = classItemList[ ++i ]; ){
                switch( item.type ){
                    case vm.EnumPattern.Char :
                        item = /** @type {!Char} */ (item);
                        set.add( item.value, item.value + 1 );
                        break;
                    case vm.EnumPattern.EscapeClass :
                        item = /** @type {!EscapeClass} */ (item);
                        set.addCharSet( Compiler_escapeClassToSet( compiler, item ) );
                        break;
                    case vm.EnumPattern.ClassRange :
                        item = /** @type {!ClassRange} */ (item);
                        set.add( item.children[ 0 ].value, item.children[ 1 ].value + 1 );
                        break;
                };
            };
            compiler.advance = true;
            return Compiler_insertBack( compiler, [ { op: node.invert ? vm.EnumOpCode.CLASS_NOT : vm.EnumOpCode.CLASS, set : set } ] );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!EscapeClass} _node 
         * @return {!vm.d.CharSet | void} */
        function Compiler_escapeClassToSet( compiler, _node ){
            var node;

            switch( _node.kind ){
                case vm.EnumKind.digit :
                    node = /** @type {!SimpleEscapeClass} */ ( _node );
                    return node.invert ? vm.charSet.InvertDigit : vm.charSet.Digit;
                case vm.EnumKind.word :
                    node = /** @type {!SimpleEscapeClass} */ ( _node );
                    if( vm.SUPPORT_ES2018 ){
                        if( compiler.unicode && compiler.ignoreCase ){
                            return node.invert ? vm.charSet.InvertUnicodeWord : vm.charSet.UnicodeWord;
                        };
                    };
                    return node.invert ? vm.charSet.InvertWord : vm.charSet.Word;
                case vm.EnumKind.space :
                    node = /** @type {!SimpleEscapeClass} */ ( _node );
                    return node.invert ? vm.charSet.InvertSpace : vm.charSet.Space;
                case vm.EnumKind.unicode_property :
                    if( vm.SUPPORT_ES2018 ){
                        node = /** @type {!UnicodePropertyEscapeClass} */ ( _node );
                        var set = vm.loadCategory( node.property ) || vm.loadProperty( node.property );
                        
                        if( !set && vm.DEFINE.DEBUG ){
                            throw new vm.RegExpSyntaxError( 'invalid Unicode property' );
                        };
                        return node.invert ? set.clone().invert() : set;
                    };
                case vm.EnumKind.unicode_property_value :
                    if( vm.SUPPORT_ES2018 ){
                        node = /** @type {!UnicodePropertyValueEscapeClass} */ ( _node );
                        var set = vm.loadPropertyValue( node.property, node.value );

                        if( !set && vm.DEFINE.DEBUG ){
                            throw new vm.RegExpSyntaxError( 'invalid Unicode property value' );
                        };
                        return node.invert ? set.clone().invert() : set;
                    };
            };
        };

        /**
         * @param {!Compiler} compiler
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileDot( compiler ){
            compiler.advance = true;
            return Compiler_insertBack( compiler, [ { op : vm.EnumOpCode.ANY } ] );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!Array.<!vm.d.OpCode>} codes 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_insertBack( compiler, codes ){
            if( compiler.direction === _DIRECTION_FORWARD ){
                return codes;
            };
            return [
                    { op: vm.EnumOpCode.BACK }
                ].concat(
                    /* ... */ codes,
                    { op: vm.EnumOpCode.BACK }
                );
        };

        /**
         * @param {!Compiler} compiler
         * @param {!BackRef} node 
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileBackRef( compiler, node ){
            if( node.index < 1 || compiler.captureParens < node.index ){
                if( vm.DEFINE.DEBUG ){
                    throw new Error('invalid back reference');
                };
            };
            compiler.advance = false;
            return [ { op: compiler.direction === _DIRECTION_BACKWARD ? vm.EnumOpCode.REF_BACK : vm.EnumOpCode.REF, index : node.index } ];
        };

        /**
         * @param {!Compiler} compiler
         * @param {!NamedBackRef} node
         * @return {!Array.<!vm.d.OpCode>} */
        function Compiler_compileNamedBackRef( compiler, node ){
            var index = vm.getCaptureGroupIndexByName( /** @type {!Array.<string | number>} */ (compiler.names), node.name );

            if( index === -1 || index < 1 || compiler.captureParens < index ){
                if( vm.DEFINE.DEBUG ){
                    throw new Error('invalid named back reference');
                };
            };
            compiler.advance = false;
            return [ { op: compiler.direction === _DIRECTION_BACKWARD ? vm.EnumOpCode.REF_BACK : vm.EnumOpCode.REF, index : index } ];
        };
    }
);
