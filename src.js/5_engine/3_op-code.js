/** `OpCode` is a type of op-codes.
 * @typedef {
 *     {op : string}
 *   | {op : string, index : number}
 *   | {op : string, from : number, to : number}
 *   | {op : string, value : number}
 *   | {op : string, cont : number}
 *   | {op : string, set : Charset}
 *   | {op : string, next : number}
 * }
*/
var OpCode;

/** Show op-codes as string.
 * @param {Array.<OpCode>} codes
 * @return {string}
 */
codesToString = function( codes ){
    function pc( i ){
        return String_padStringWithZero( i + '', 3 );
    };
    function op( s ){
        return String_padEndWithSpace( s, 13 );
    };

    const lines = Array_map( codes,
        function( code, lineno ){
            let line = pc( lineno ) + ': ' + op( code.op );

            switch( code.op ){
                case 'cap_begin':
                case 'cap_end':
                    line += code.index;
                    break;
                case 'cap_reset':
                    line += code.from + ' ' + code.to;
                    break;
                case 'char':
                    line += "'" + escapeCodePointAsRegExpSpurceChar( code.value ) + "'";
                    break;
                case 'class':
                case 'class_not':
                    line += code.set.toRegExpPattern( code.op === 'class_not' );
                    break;
                case 'fork_cont':
                case 'fork_next':
                    line += pc( lineno + 1 + code.next );
                    break;
                case 'jump':
                case 'loop':
                    line += pc( lineno + 1 + code.cont );
                    break;
                case 'push':
                    line += code.value;
                    break;
                case 'ref':
                case 'ref_back':
                    line += code.index;
                    break;
            };
            return line;
        }
    );

    return lines.join( '\n' );
};
