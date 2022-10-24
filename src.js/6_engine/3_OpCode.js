/** @typedef {{op:(string|number)}} */
var OpCode_Any;
/** @typedef {{op:(string|number)}} */
var OpCode_Back;
/** @typedef {{op:(string|number),index:number}} */
var OpCode_Cap_begin;
/** @typedef {{op:(string|number),index:number}} */
var OpCode_Cap_end;
/** @typedef {{op:(string|number),from:number,to:number}} */
var OpCode_Cap_reset;
/** @typedef {{op:(string|number),value:number}} */
var OpCode_Char;
/** @typedef {{op:(string|number),set:CharSet}} */
var OpCode_Class;
/** @typedef {{op:(string|number),set:CharSet}} */
var OpCode_Class_not;
/** @typedef {{op:(string|number)}} */
var OpCode_Dec;
/** @typedef {{op:(string|number)}} */
var OpCode_Empty_check;
/** @typedef {{op:(string|number)}} */
var OpCode_Fail;
/** @typedef {{op:(string|number),next:number}} */
var OpCode_Fork_cont;
/** @typedef {{op:(string|number),next:number}} */
var OpCode_Fork_next;
/** @typedef {{op:(string|number),cont:number}} */
var OpCode_Jump;
/** @typedef {{op:(string|number)}} */
var OpCode_Line_begin;
/** @typedef {{op:(string|number)}} */
var OpCode_Line_end;
/** @typedef {{op:(string|number),cont:number}} */
var OpCode_Loop;
/** @typedef {{op:(string|number)}} */
var OpCode_Match;
/** @typedef {{op:(string|number)}} */
var OpCode_Pop;
/** @typedef {{op:(string|number),value:number}} */
var OpCode_Push;
/** @typedef {{op:(string|number)}} */
var OpCode_Push_pos;
/** @typedef {{op:(string|number)}} */
var OpCode_PushProc;
/** @typedef {{op:(string|number),index:number}} */
var OpCode_Ref;
/** @typedef {{op:(string|number),index:number}} */
var OpCode_Ref_back;
/** @typedef {{op:(string|number)}} */
var OpCode_Restore_pos;
/** @typedef {{op:(string|number)}} */
var OpCode_Rewind_proc;
/** @typedef {{op:(string|number)}} */
var OpCode_Word_boundary;
/** @typedef {{op:(string|number)}} */
var OpCode_Word_boundary_not;

/** `OpCode` is a type of op-codes.
 * @typedef {OpCode_Any| OpCode_Back| OpCode_Cap_begin | OpCode_Cap_end | OpCode_Cap_reset| OpCode_Char| OpCode_Class | OpCode_Class_not| OpCode_Dec | OpCode_Empty_check| OpCode_Fail| OpCode_Fork_cont | OpCode_Fork_next| OpCode_Jump   | OpCode_Line_begin | OpCode_Line_end | OpCode_Loop| OpCode_Match| OpCode_Pop| OpCode_Push_pos | OpCode_PushProc| OpCode_Ref | OpCode_Ref_back| OpCode_Restore_pos| OpCode_Rewind_proc| OpCode_Word_boundary | OpCode_Word_boundary_not}
*/
var OpCode;

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    /** Show op-codes as string.
     * @param {Array.<OpCode>} codes
     * @return {string}
     */
    codesToString = function( codes ){
        function pc( i ){
            return '#' + String_padStringWithZero( i + '', 3 );
        };
        function op( s ){
            return String_padEndWithSpace( s, 13 );
        };

        var lines = Array_map( codes,
            function( code, lineno ){
                var line = pc( lineno ) + ': ' + op( code.op );

                switch( code.op ){
                    case REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN:
                    case REGEXP_COMPAT__OPCODE_IS_CAP_END:
                        line += code.index;
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_CAP_RESET:
                        line += code.from + ' ' + code.to;
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_CHAR:
                        line += "'" + m_escapeCodePointAsRegExpSpurceChar( code.value ) + "'";
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_CLASS:
                    case REGEXP_COMPAT__OPCODE_IS_CLASS_NOT:
                        line += code.set.toRegExpPattern( code.op === REGEXP_COMPAT__OPCODE_IS_CLASS_NOT );
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_FORK_CONT:
                    case REGEXP_COMPAT__OPCODE_IS_FORK_NEXT:
                        line += pc( lineno + 1 + code.next );
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_JUMP:
                    case REGEXP_COMPAT__OPCODE_IS_LOOP:
                        line += pc( lineno + 1 + code.cont );
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_PUSH:
                        line += code.value;
                        break;
                    case REGEXP_COMPAT__OPCODE_IS_REF:
                    case REGEXP_COMPAT__OPCODE_IS_REF_BACK:
                        line += code.index;
                        break;
                };
                return line;
            }
        );

        return lines.join( '\n' );
    };

    if( DEFINE_REGEXP_COMPAT__NODEJS ){
        module[ 'exports' ][ 'codesToString' ] = codesToString;
    };
};
