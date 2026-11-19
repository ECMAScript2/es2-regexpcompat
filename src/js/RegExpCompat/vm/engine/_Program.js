goog.provide( 'vm.Program' );

goog.require( 'vm.SUPPORT_ES2018' );
goog.require( 'vm.shim.str.codePointAt' );
goog.require( 'vm.EnumOpCode' );
goog.require( 'vm.math.max' );
goog.require( 'vm.shim.ary.from' );
goog.require( 'vm.d.OpCode' );
goog.require( 'vm.Match' );
goog.require( 'vm.canonicalize' );
goog.require( 'vm.uncanonicalize' );
goog.requireType( 'vm.d.FlagSet' );

goog.scope(
    function(){
        /** Get `s[i]` code point.
         * 
         * @param {string} s 
         * @param {number} i 
         * @param {boolean=} unicode 
         * @return {number} */
        function getIndex( s, i, unicode ){
            var c;

            if( vm.SUPPORT_ES2018 && unicode ){
                c = vm.shim.str.codePointAt( s, i );
                return c !== undefined ? c : -1;
            };

            c = s.charCodeAt( i );
            return /* Number.isNaN( c ) */ c !== c ? -1 : c;
        };

        /** Get `s[i - 1]` code point.
         * 
         * @param {string} s 
         * @param {number} i 
         * @param {boolean=} unicode 
         * @return {number} */
        function prevIndex( s, i, unicode ){
            var c = vm.SUPPORT_ES2018 ? getIndex( s, i - 1, unicode ) : getIndex( s, i - 1 );

            if( !vm.SUPPORT_ES2018 || !unicode ){
                return c;
            };

            if( 0xdc00 <= c && c <= 0xdfff ){
                var d = getIndex( s, i - 2, unicode );
                if( 0x10000 <= d && d <= 0x10ffff ){
                    return d;
                };
            };
            return c;
        };

        /** Calculate code point size.
         * @param {number} c
         * @return {number} */
        function size( c ){
            return c >= 0x10000 ? 2 : 1
        };

        /** Check the code point is line terminator.
         * @param {number} c
         * @return {boolean} */
        function isLineTerminator( c ){
            return c === 0x0a || c === 0x0d || c === 0x2028 || c === 0x2029;
        };

        /** Calculate the maximum stack size without execution.
         * @param {!Array.<!vm.d.OpCode>} codes
         * @return {number} */
        function calculateMaxStackSize( codes ){
            var i = -1, code;
            var stackSize = 0;
            var maxStackSize = 0;

            for( ; code = codes[ ++i ]; ){
                switch( code.op ){
                    case vm.EnumOpCode.PUSH:
                    case vm.EnumOpCode.PUSH_POS:
                    case vm.EnumOpCode.PUSH_PROC:
                        ++stackSize;
                        break;
                    case vm.EnumOpCode.EMPTY_CHECK:
                    case vm.EnumOpCode.POP:
                    case vm.EnumOpCode.RESTORE_POS:
                    case vm.EnumOpCode.REWIND_PROC:
                        --stackSize;
                        break;
                };
                maxStackSize = vm.math.max( stackSize, maxStackSize );
            };
            return maxStackSize;
        };

        /** `Proc` is execution state of VM.
         * @constructor
         * 
         * @param {number} pos
         * @param {number} pc
         * @param {!Array.<number>} stack
         * @param {number} stackSize
         * @param {!Array.<number>} caps */
        function Proc( pos, pc, stack, stackSize, caps ){
            /** A current position of `input` string.
             * @type {number} */
            this.pos = pos;
            /** A program counter.
             * @type {number} */
            this.pc = pc;
            /**
             * A stack for matching.
             *
             * This stack can contain a position, a counter and a `proc` id.
             * Every values are integer value, so this type is an array of `number`.
             *
             * Note that this stack is allocated to available size before execution.
             * So, the real stack size is managed by `stackSize` property.
             * 
             * @type {!Array.<number>} */
            this.stack = stack;
            /** A current stack size.
             * @type {number} */
            this.stackSize = stackSize;
            /** A capture indexes.
             * @type {!Array.<number>} */
            this.caps = caps;
        };

        /** Clone this.
         * @return {!Proc} */
        Proc.prototype.clone = function(){
            return new Proc(
                this.pos,
                this.pc,
                vm.shim.ary.from( this.stack ),
                this.stackSize,
                vm.shim.ary.from( this.caps )
            );
        };

        /**
         * @param {number} pos 
         * @param {number} captureParens 
         * @param {number} maxStackSize 
         * @return {!Proc} */
        function createProc( pos, captureParens, maxStackSize ){
            var caps = [];
            var capsLength = ( captureParens + 1 ) * 2;
            var i;
            var stack = [];

            for( i = 0; i < capsLength; ++i ){
                caps.push( -1 );
            };
            for( i = 0; i < maxStackSize; ++i ){
                stack.push( 0 );
            };
            return new Proc( pos, 0, stack, 0, caps );
        };

        /** `Program` is a container of compiled regular expreession.
         *
         * This can execute op-codes on VM also.
         *
         * @package
         * @constructor
         * @param {!Pattern} pattern
         * @param {!Array.<!vm.d.OpCode>} codes */
        vm.Program = function( pattern, codes ){
            if( vm.DEFINE.DEBUG ){
                /** A regular expression pattern.
                 * @type {!Pattern} */
                this.pattern = pattern;
            };

            /** An array of op-codes compiled `pattern`.
             * @type {!Array.<!vm.d.OpCode>} */
            this.codes = codes;

            /** Pre-calculated maximum stack size.
             * @type {number} */
            this.maxStackSize = calculateMaxStackSize( codes );

            /** @type {boolean} */
            this.ignoreCase = pattern.flagSet.ignoreCase;

            /** @type {boolean} */
            this.multiline = pattern.flagSet.multiline;

            if( vm.SUPPORT_ES2018 ){
                this.dotAll  = /** @type {boolean} */ (pattern.flagSet.dotAll);
                this.unicode = /** @type {boolean} */ (pattern.flagSet.unicode);
                this.names   = /** @type {!Array.<string | number>} */ (pattern.names);
            };

            this.sticky = /** @type {boolean} */ (pattern.flagSet.sticky);

            /** @type {number} */
            this.captureParens = pattern.captureParens;
        };

        if( vm.DEFINE.DEBUG ){
            vm.Program.prototype.toString = function(){
                var codes = vm.codesToString( this.codes ).split( '\n' ).join( '\n    ' );

                return 'Program {\n' +
                    '  pattern: ' + vm.patternToString( this.pattern ) + ',\n' +
                    '  codes:\n' +
                    '    ' + codes + '\n' +
                    '}';
            };
        };

        /**
         * @param {string} input 
         * @param {number} pos 
         * @return {!vm.Match | null} */
        vm.Program.prototype.exec = function( input, pos ){
            while( pos <= input.length ){
                var procs = [ createProc( pos, this.captureParens, this.maxStackSize ) ];

                while( procs.length > 0 ){
                    var proc = procs[ procs.length - 1 ];
                    var code = this.codes[ proc.pc ];
                    var backtrack = false;
                    ++proc.pc;

                    var c, d, cc, dc;

                    switch( code.op ){
                        case vm.EnumOpCode.ANY :
                            c = vm.SUPPORT_ES2018 ? getIndex( input, proc.pos, this.unicode ) : getIndex( input, proc.pos );
                            if( c >= 0 && ( ( vm.SUPPORT_ES2018 && this.dotAll ) || !isLineTerminator( c ) ) ){
                                proc.pos += size( c );
                            } else {
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.BACK :
                            c = vm.SUPPORT_ES2018 ? prevIndex( input, proc.pos, this.unicode ) : prevIndex( input, proc.pos );
                            if( c >= 0 ){
                                proc.pos -= size( c );
                            } else {
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.CAP_BEGIN :
                            proc.caps[ /** @type {!vm.d.OpCode.Cap_begin} */ (code).index * 2 ] = proc.pos;
                            break;
                        case vm.EnumOpCode.CAP_END :
                            proc.caps[ /** @type {!vm.d.OpCode.Cap_end} */ (code).index * 2 + 1 ] = proc.pos;
                            break;
                        case vm.EnumOpCode.CAP_RESET :
                            for( var i = /** @type {!vm.d.OpCode.Cap_reset} */ (code).from; i < /** @type {!vm.d.OpCode.Cap_reset} */ (code).to; ++i ){
                                proc.caps[ i * 2 ] = proc.caps[ i * 2 + 1 ] = -1;
                            };
                            break;
                        case vm.EnumOpCode.CHAR :
                            c = vm.SUPPORT_ES2018 ? getIndex( input, proc.pos, this.unicode ) : getIndex( input, proc.pos );
                            if( c < 0 ){
                                backtrack = true;
                            };
                            cc = this.ignoreCase ? vm.SUPPORT_ES2018 ? vm.canonicalize( c, this.unicode ) : vm.canonicalize( c ) : c;
                            if( cc === /** @type {!vm.d.OpCode.Char} */ (code).value ){
                                proc.pos += size( c );
                            } else {
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.CLASS :
                        case vm.EnumOpCode.CLASS_NOT :
                            c = vm.SUPPORT_ES2018 ? getIndex( input, proc.pos, this.unicode ) : getIndex( input, proc.pos );;
                            if( c < 0 ){
                                backtrack = true;
                                break;
                            };
                            cc = this.ignoreCase ? vm.SUPPORT_ES2018 ? vm.canonicalize( c, this.unicode ) : vm.canonicalize( c ) : c;

                            var actual = /** @type {!vm.d.OpCode.Class|!vm.d.OpCode.Class_not} */ (code).set.has( cc );
                            var expected = /** @type {!vm.d.OpCode.Class|!vm.d.OpCode.Class_not} */ (code).op === vm.EnumOpCode.CLASS;

                            if( this.ignoreCase ){
                                var uncanonicalized = vm.SUPPORT_ES2018 ? vm.uncanonicalize( cc, this.unicode ) : vm.uncanonicalize( cc ); // memo 何度も vm.uncanonicalize() が呼ばれるのを修正
                                var l = uncanonicalized.length;
                                for( d = 0; d < l; ++d ){
                                    actual = actual || /** @type {!vm.d.OpCode.Class|!vm.d.OpCode.Class_not} */ (code).set.has( uncanonicalized[ d ] );
                                };
                            };

                            if( actual === expected ){
                                proc.pos += size( c );
                            } else {
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.DEC:
                            --proc.stack[ proc.stackSize - 1 ];
                            break;
                        case vm.EnumOpCode.EMPTY_CHECK :
                            if( proc.stack[ --proc.stackSize ] === proc.pos ){
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.FAIL:
                            backtrack = true;
                            break;
                        case vm.EnumOpCode.FORK_CONT :
                        case vm.EnumOpCode.FORK_NEXT :
                            var newProc = proc.clone();
                            procs.push( newProc );
                            if( code.op === vm.EnumOpCode.FORK_CONT ){
                                proc.pc += /** @type {!vm.d.OpCode.Fork_cont} */ (code).next;
                            } else {
                                newProc.pc += /** @type {!vm.d.OpCode.Fork_next} */ (code).next;
                            };
                            break;
                        case vm.EnumOpCode.JUMP:
                            proc.pc += /** @type {!vm.d.OpCode.Jump} */ (code).cont;
                            break;
                        case vm.EnumOpCode.LINE_BEGIN :
                            c = vm.SUPPORT_ES2018 ? prevIndex( input, proc.pos, this.unicode ) : prevIndex( input, proc.pos );
                            if( proc.pos !== 0 && !( this.multiline && isLineTerminator( c ) ) ){
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.LINE_END:
                            c = vm.SUPPORT_ES2018 ? getIndex( input, proc.pos, this.unicode ) : getIndex( input, proc.pos );
                            if( proc.pos !== input.length && !( this.multiline && isLineTerminator( c ) ) ){
                                backtrack = true;
                            };
                            break;
                        case vm.EnumOpCode.LOOP:
                            var n = proc.stack[ proc.stackSize - 1 ];
                            if( n > 0 ){
                                proc.pc += /** @type {!vm.d.OpCode.Loop} */ (code).cont;
                            };
                            break;
                        case vm.EnumOpCode.MATCH:
                            if( vm.SUPPORT_ES2018 ){
                                return new vm.Match( input, proc.caps, this.names );
                            } else {
                                return new vm.Match( input, proc.caps );
                            };
                        case vm.EnumOpCode.POP:
                            --proc.stackSize;
                            break;
                        case vm.EnumOpCode.PUSH:
                            proc.stack[ proc.stackSize++ ] = /** @type {!vm.d.OpCode.Push} */ (code).value;
                            break;
                        case vm.EnumOpCode.PUSH_POS:
                            proc.stack[ proc.stackSize++ ] = proc.pos;
                            break;
                        case vm.EnumOpCode.PUSH_PROC:
                            proc.stack[ proc.stackSize++ ] = procs.length;
                            break;
                        case vm.EnumOpCode.REF:
                            var begin = proc.caps[ /** @type {!vm.d.OpCode.Ref} */ (code).index * 2 ];
                            var end = proc.caps[ /** @type {!vm.d.OpCode.Ref} */ (code).index * 2 + 1 ];
                            var s = begin < 0 || end < 0 ? '' : input.slice( begin, end );
                            var i = 0;
                            while( i < s.length ){
                                c = vm.SUPPORT_ES2018 ? getIndex( input, proc.pos, this.unicode ) : getIndex( input, proc.pos );
                                d = vm.SUPPORT_ES2018 ? getIndex(      s,       i, this.unicode ) : getIndex( s, i );

                                cc = this.ignoreCase ? vm.SUPPORT_ES2018 ? vm.canonicalize( c, this.unicode ) : vm.canonicalize( c ) : c;
                                dc = this.ignoreCase ? vm.SUPPORT_ES2018 ? vm.canonicalize( d, this.unicode ) : vm.canonicalize( d ) : d;

                                if( cc !== dc ){
                                    backtrack = true;
                                    break;
                                };

                                proc.pos += size( c );
                                i += size( d );
                            };
                            break;
                        case vm.EnumOpCode.REF_BACK:
                            var begin = proc.caps[ /** @type {!vm.d.OpCode.Ref_back} */ (code).index * 2 ];
                            var end = proc.caps[ /** @type {!vm.d.OpCode.Ref_back} */ (code).index * 2 + 1 ];
                            var s = begin < 0 || end < 0 ? '' : input.slice( begin, end );
                            var i = s.length;
                            while( i > 0 ){
                                c = vm.SUPPORT_ES2018 ? prevIndex( input, proc.pos, this.unicode ) : prevIndex( input, proc.pos );
                                d = vm.SUPPORT_ES2018 ? prevIndex(     s,        i, this.unicode ) : prevIndex( s, i );

                                cc = this.ignoreCase ? vm.SUPPORT_ES2018 ? vm.canonicalize( c, this.unicode ) : vm.canonicalize( c ) : c;
                                dc = this.ignoreCase ? vm.SUPPORT_ES2018 ? vm.canonicalize( d, this.unicode ) : vm.canonicalize( d ) : d;

                                if( cc !== dc ){
                                    backtrack = true;
                                    break;
                                };

                                proc.pos -= size( c );
                                i -= size( d );
                            };
                            break;
                        case vm.EnumOpCode.RESTORE_POS:
                            proc.pos = proc.stack[ --proc.stackSize ];
                            break;
                        case vm.EnumOpCode.REWIND_PROC:
                            procs.length = proc.stack[ --proc.stackSize ];
                            procs[ procs.length - 1 ] = proc;
                            break;
                        case vm.EnumOpCode.WORD_BOUNDARY:
                        case vm.EnumOpCode.WORD_BOUNDARY_NOT:
                            c = vm.SUPPORT_ES2018 ? prevIndex( input, proc.pos, this.unicode ) : prevIndex( input, proc.pos );
                            d = vm.SUPPORT_ES2018 ? getIndex( input, proc.pos, this.unicode ) : getIndex( input, proc.pos );
                            var set = vm.SUPPORT_ES2018 && this.unicode && this.ignoreCase ? vm.charSet.UnicodeWord : vm.charSet.Word;
                            var actual = set.has( c ) !== set.has( d );
                            var expected = code.op === vm.EnumOpCode.WORD_BOUNDARY;
                            if( actual !== expected ){
                                backtrack = true;
                            };
                            break;
                    };

                    if( backtrack ){
                        procs.pop();
                    };
                };

                if( this.sticky ){
                    break;
                };

                pos += size( vm.SUPPORT_ES2018 ? getIndex( input, pos, this.unicode ) : getIndex( input, pos ) );
            };

            return null;
        };
    }
);