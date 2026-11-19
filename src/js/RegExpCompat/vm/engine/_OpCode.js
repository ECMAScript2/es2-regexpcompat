goog.provide( 'vm.EnumOpCode' );
goog.provide( 'vm.d.OpCode' );
goog.provide( 'vm.codesToString' );

goog.requireType( 'vm.d.CharSet' );
goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.shim.str.padStringWithZero' );
goog.require( 'vm.shim.str.padEndWithSpace' );
goog.require( 'vm.shim.ary.map' );

/**
 * @package
 * @enum {number | string} */
vm.EnumOpCode = {
    ANY               : vm.DEFINE.MINIFY ?  0 : 'any',
    BACK              : vm.DEFINE.MINIFY ?  1 : 'back',
    CAP_BEGIN         : vm.DEFINE.MINIFY ?  2 : 'cap_begin',
    CAP_END           : vm.DEFINE.MINIFY ?  3 : 'cap_end',
    CAP_RESET         : vm.DEFINE.MINIFY ?  4 : 'cap_reset',
    CHAR              : vm.DEFINE.MINIFY ?  5 : 'char',
    CLASS             : vm.DEFINE.MINIFY ?  6 : 'class',
    CLASS_NOT         : vm.DEFINE.MINIFY ?  7 : 'class_not',
    DEC               : vm.DEFINE.MINIFY ?  8 : 'dec',
    EMPTY_CHECK       : vm.DEFINE.MINIFY ?  9 : 'empty_check',
    FAIL              : vm.DEFINE.MINIFY ? 10 : 'fail',
    FORK_CONT         : vm.DEFINE.MINIFY ? 11 : 'fork_cont',
    FORK_NEXT         : vm.DEFINE.MINIFY ? 12 : 'fork_next',
    JUMP              : vm.DEFINE.MINIFY ? 13 : 'jump',
    LINE_BEGIN        : vm.DEFINE.MINIFY ? 14 : 'line_begin',
    LINE_END          : vm.DEFINE.MINIFY ? 15 : 'line_end',
    LOOP              : vm.DEFINE.MINIFY ? 16 : 'loop',
    MATCH             : vm.DEFINE.MINIFY ? 17 : 'match',
    POP               : vm.DEFINE.MINIFY ? 18 : 'pop',
    PUSH              : vm.DEFINE.MINIFY ? 19 : 'push',
    PUSH_POS          : vm.DEFINE.MINIFY ? 20 : 'push_pos',
    PUSH_PROC         : vm.DEFINE.MINIFY ? 21 : 'push_proc',
    REF               : vm.DEFINE.MINIFY ? 22 : 'ref',
    REF_BACK          : vm.DEFINE.MINIFY ? 23 : 'ref_back',
    RESTORE_POS       : vm.DEFINE.MINIFY ? 24 : 'restore_pos',
    REWIND_PROC       : vm.DEFINE.MINIFY ? 25 : 'rewind_proc',
    WORD_BOUNDARY     : vm.DEFINE.MINIFY ? 26 : 'word_boundary',
    WORD_BOUNDARY_NOT : vm.DEFINE.MINIFY ? 27 : 'word_boundary_not'
};

goog.scope(
    function(){
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Any;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Back;
        /** @typedef {{op:vm.EnumOpCode, index:number}} */
        vm.d.OpCode.Cap_begin;
        /** @typedef {{op:vm.EnumOpCode, index:number}} */
        vm.d.OpCode.Cap_end;
        /** @typedef {{op:vm.EnumOpCode, from:number, to:number}} */
        vm.d.OpCode.Cap_reset;
        /** @typedef {{op:vm.EnumOpCode, value:number}} */
        vm.d.OpCode.Char;
        /** @typedef {{op:vm.EnumOpCode, set:!vm.d.CharSet}} */
        vm.d.OpCode.Class;
        /** @typedef {{op:vm.EnumOpCode, set:!vm.d.CharSet}} */
        vm.d.OpCode.Class_not;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Dec;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Empty_check;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Fail;
        /** @typedef {{op:vm.EnumOpCode, next:number}} */
        vm.d.OpCode.Fork_cont;
        /** @typedef {{op:vm.EnumOpCode, next:number}} */
        vm.d.OpCode.Fork_next;
        /** @typedef {{op:vm.EnumOpCode, cont:number}} */
        vm.d.OpCode.Jump;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Line_begin;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Line_end;
        /** @typedef {{op:vm.EnumOpCode, cont:number}} */
        vm.d.OpCode.Loop;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Match;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Pop;
        /** @typedef {{op:vm.EnumOpCode, value:number}} */
        vm.d.OpCode.Push;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Push_pos;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.PushProc;
        /** @typedef {{op:vm.EnumOpCode, index:number}} */
        vm.d.OpCode.Ref;
        /** @typedef {{op:vm.EnumOpCode, index:number}} */
        vm.d.OpCode.Ref_back;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Restore_pos;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Rewind_proc;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Word_boundary;
        /** @typedef {{op:vm.EnumOpCode}} */
        vm.d.OpCode.Word_boundary_not;

        /** `OpCode` is a type of op-codes.
         * @package
         * @typedef {
         *   vm.d.OpCode.Any         | vm.d.OpCode.Back        | vm.d.OpCode.Cap_begin     |
         *   vm.d.OpCode.Cap_end     | vm.d.OpCode.Cap_reset   | vm.d.OpCode.Char          |
         *   vm.d.OpCode.Class       | vm.d.OpCode.Class_not   | vm.d.OpCode.Dec           |
         *   vm.d.OpCode.Empty_check | vm.d.OpCode.Fail        | vm.d.OpCode.Fork_cont     |
         *   vm.d.OpCode.Fork_next   | vm.d.OpCode.Jump        | vm.d.OpCode.Line_begin    |
         *   vm.d.OpCode.Line_end    | vm.d.OpCode.Loop        | vm.d.OpCode.Match         |
         *   vm.d.OpCode.Pop         | vm.d.OpCode.Push        | vm.d.OpCode.Push_pos      |
         *   vm.d.OpCode.PushProc    | vm.d.OpCode.Ref         | vm.d.OpCode.Ref_back      |
         *   vm.d.OpCode.Restore_pos | vm.d.OpCode.Rewind_proc | vm.d.OpCode.Word_boundary |
         *   vm.d.OpCode.Word_boundary_not
         * }
         */
        vm.d.OpCode;

        /** Show op-codes as string.
         * @package
         * @param {!Array.<!vm.d.OpCode>} codes
         * @return {string} */
        vm.codesToString = function( codes ){
            function pc( i ){
                return '#' + vm.shim.str.padStringWithZero( i + '', 3 );
            };
            function op( s ){
                return vm.shim.str.padEndWithSpace( s, 13 );
            };

            var lines = vm.shim.ary.map( codes,
                function( code, lineno ){
                    var line = pc( lineno ) + ': ' + op( code.op );

                    switch( code.op ){
                        case vm.EnumOpCode.CAP_BEGIN:
                        case vm.EnumOpCode.CAP_END:
                            line += code.index;
                            break;
                        case vm.EnumOpCode.CAP_RESET:
                            line += code.from + ' ' + code.to;
                            break;
                        case vm.EnumOpCode.CHAR:
                            line += "'" + vm.escapeCodePointAsRegExpSourceChar( code.value ) + "'";
                            break;
                        case vm.EnumOpCode.CLASS:
                        case vm.EnumOpCode.CLASS_NOT:
                            line += code.set.toRegExpPattern( code.op === vm.EnumOpCode.CLASS_NOT );
                            break;
                        case vm.EnumOpCode.FORK_CONT:
                        case vm.EnumOpCode.FORK_NEXT:
                            line += pc( lineno + 1 + code.next );
                            break;
                        case vm.EnumOpCode.JUMP:
                        case vm.EnumOpCode.LOOP:
                            line += pc( lineno + 1 + code.cont );
                            break;
                        case vm.EnumOpCode.PUSH:
                            line += code.value;
                            break;
                        case vm.EnumOpCode.REF:
                        case vm.EnumOpCode.REF_BACK:
                            line += code.index;
                            break;
                    };
                    return line;
                }
            );

            return lines.join( '\n' );
        };
    }
);


