/** Get `s[i]` code point.
 * 
 * @param {string} s 
 * @param {number} i 
 * @param {boolean=} unicode 
 * @return {number}
 */
function getIndex( s, i, unicode ){
    var c;

    if( unicode ){
        c = String_codePointAt( s, i );
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
 * @return {number}
 */
function prevIndex( s, i, unicode ){
    const c = getIndex( s, i - 1, unicode );

    if( !unicode ){
        return c;
    };

    if( 0xdc00 <= c && c <= 0xdfff ){
        const d = getIndex( s, i - 2, unicode );
        if( 0x10000 <= d && d <= 0x10ffff ){
            return d;
        };
    };
    return c;
};

/** Calculate code point size.
 * @param {number} c
 * @return {number}
 */
function size( c ){
    return c >= 0x10000 ? 2 : 1
};

/** Check the code point is line terminator.
 * @param {number} c
 * @return {boolean}
 */
function isLineTerminator( c ){
    return c === 0x0a || c === 0x0d || c === 0x2028 || c === 0x2029;
};

/** Calculate the maximum stack size without execution.
 * @param {Array.<OpCode>} codes
 * @return {number}
 */
function calculateMaxStackSize( codes ){
    var i = -1, code;
    let stackSize = 0;
    let maxStackSize = 0;

    for( ; code = codes[ ++i ]; ){
        switch( code.op ){
            case REGEXP_COMPAT__OPCODE_IS_PUSH:
            case REGEXP_COMPAT__OPCODE_IS_PUSH_POS:
            case REGEXP_COMPAT__OPCODE_IS_PUSH_PROC:
                ++stackSize;
                break;
            case REGEXP_COMPAT__OPCODE_IS_EMPTY_CHECK:
            case REGEXP_COMPAT__OPCODE_IS_POP:
            case REGEXP_COMPAT__OPCODE_IS_RESTORE_POS:
            case REGEXP_COMPAT__OPCODE_IS_REWIND_PROC:
                --stackSize;
                break;
        };
        maxStackSize = Math.max( stackSize, maxStackSize );
    };
    return maxStackSize;
};

/** `Proc` is execution state of VM.
 * @constructor
 * 
 * @param {number} pos
 * @param {number} pc
 * @param {Array.<number>} stack
 * @param {number} stackSize
 * @param {Array.<number>} caps
 */
function Proc( pos, pc, stack, stackSize, caps ){
    /** A current position of `input` string.
     * @type {number}
     */
    this.pos = pos;
    /** A program counter.
     * @type {number}
     */
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
     * @type {Array.<number>}
     */
    this.stack = stack;
    /** A current stack size.
     * @type {number}
     */
    this.stackSize = stackSize;
    /** A capture indexes.
     * @type {Array.<number>}
     */
    this.caps = caps;
};

/** Clone this.
 * @return {Proc}
 */
Proc.prototype.clone = function(){
    return new Proc(
        this.pos,
        this.pc,
        Array_from( this.stack ),
        this.stackSize,
        Array_from( this.caps )
    );
};

/**
 * `Program` is a container of compiled regular expreession.
 *
 * This can execute op-codes on VM also.
 * 
 * @constructor
 * @param {Pattern} pattern
 * @param {Array.<OpCode>} codes
 */
function Program( pattern, codes ){
    /** A regular expression pattern.
     * @type {Pattern} */
    this.pattern = pattern;

    /** An array of op-codes compiled `pattern`.
     * @type {Array.<OpCode>}
     */
    this.codes = codes;

    /** Pre-calculated maximum stack size.
     * @type {number}
     */
    this.maxStackSize = calculateMaxStackSize( codes );

    /** @type {boolean} */
    this.ignoreCase = pattern.flagSet.ignoreCase;

    /** @type {boolean} */
    this.multiline = pattern.flagSet.multiline;

    if( DEFINE_REGEXP_COMPAT__ES2018 ){
        this.dotAll = /** @type {boolean} */ (pattern.flagSet.dotAll);
    };

    /** @type {boolean} */
    this.unicode = pattern.flagSet.unicode;

    /** @type {boolean} */
    this.sticky = pattern.flagSet.sticky;

    /** @type {number} */
    this.captureParens = pattern.captureParens; // TODO

    /** @type {Map} */
    this.names = pattern.names;
};

if( DEFINE_REGEXP_COMPAT__DEBUG ){
    Program.prototype.toString = function(){
        let s = '';
        const codes = codesToString(this.codes).split('\n').join('\n    ');
        s += 'Program {\n';
        s += `  pattern: ${patternToString(this.pattern)},\n`;
        s += '  codes:\n';
        s += `    ${codes}\n`;
        s += '}';
        return s;
    };
    /**
     * @param {*} depth 
     * @param {InspectOptionsStylized} options 
     * @return {string}
     */
    Program.prototype[Symbol.for('nodejs.util.inspect.custom')] = function( depth, options ){
        let s = ``;
        const pattern = options.stylize(patternToString(this.pattern), 'regexp');
        const codes = codesToString(this.codes)
          .split('\n')
          .map((line) => options.stylize(line, 'string'))
          .join('\n    ');
        s += `${options.stylize('Program', 'special')} {\n`;
        s += `  pattern: ${pattern},\n`;
        s += '  codes:\n';
        s += `    ${codes}\n`;
        s += '}';
        return s;
    };    
};

/**
 * @param {string} input 
 * @param {number} pos 
 * @returns 
 */
Program.prototype.exec = function( input, pos ){
    while( pos <= input.length ){
        const procs = [];
        procs.push( Program_createProc( pos, this.captureParens, this.maxStackSize ) );

        while( procs.length > 0 ){
            const proc = procs[ procs.length - 1 ];
            const code = this.codes[ proc.pc ];
            let backtrack = false;
            ++proc.pc;

            let c;

            switch( code.op ){
                case REGEXP_COMPAT__OPCODE_IS_ANY :
                    c = getIndex( input, proc.pos, this.unicode );
                    if( c >= 0 && ( ( DEFINE_REGEXP_COMPAT__ES2018 && this.dotAll ) || !isLineTerminator( c ) ) ){
                        proc.pos += size( c );
                    } else {
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_BACK :
                    c = prevIndex( input, proc.pos, this.unicode );
                    if( c >= 0 ){
                        proc.pos -= size( c );
                    } else {
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_CAP_BEGIN :
                    proc.caps[ /** @type {OpCode_Cap_begin} */ (code).index * 2 ] = proc.pos;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_CAP_END :
                    proc.caps[ /** @type {OpCode_Cap_end} */ (code).index * 2 + 1 ] = proc.pos;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_CAP_RESET :
                    for( let i = /** @type {OpCode_Cap_reset} */ (code).from; i < /** @type {OpCode_Cap_reset} */ (code).to; ++i ){
                        proc.caps[ i * 2 ] = proc.caps[ i * 2 + 1 ] = -1;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_CHAR :
                    c = getIndex( input, proc.pos, this.unicode );
                    if( c < 0 ){
                        backtrack = true;
                    };
                    var cc = this.ignoreCase ? canonicalize( c, this.unicode ) : c;
                    if( cc === /** @type {OpCode_Char} */ (code).value ){
                        proc.pos += size( c );
                    } else {
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_CLASS :
                case REGEXP_COMPAT__OPCODE_IS_CLASS_NOT :
                    c = getIndex( input, proc.pos, this.unicode );
                    if( c < 0 ){
                        backtrack = true;
                        break;
                    };
                    var cc = this.ignoreCase ? canonicalize( c, this.unicode ) : c;

                    var actual = /** @type {OpCode_Class|OpCode_Class_not} */ (code).set.has( cc );
                    var expected = /** @type {OpCode_Class|OpCode_Class_not} */ (code).op === REGEXP_COMPAT__OPCODE_IS_CLASS;

                    if( this.ignoreCase ){
                        const uncanonicalized = uncanonicalize( cc, this.unicode ); // memo 何度も uncanonicalize() が呼ばれるのを修正
                        for( let d = 0, l = uncanonicalized.length; d < l; ++d ){
                            actual = actual || /** @type {OpCode_Class|OpCode_Class_not} */ (code).set.has( uncanonicalized[ d ] );
                        };
                    };

                    if( actual === expected ){
                        proc.pos += size( c );
                    } else {
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_DEC:
                    --proc.stack[ proc.stackSize - 1 ];
                    break;
                case REGEXP_COMPAT__OPCODE_IS_EMPTY_CHECK :
                    const pos = proc.stack[ --proc.stackSize ];
                    if( pos === proc.pos ){
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_FAIL:
                    backtrack = true;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_FORK_CONT :
                case REGEXP_COMPAT__OPCODE_IS_FORK_NEXT :
                    const newProc = proc.clone();
                    procs.push( newProc );
                    if( /** @type {OpCode_Fork_cont|OpCode_Fork_next} */ (code).op === REGEXP_COMPAT__OPCODE_IS_FORK_CONT ){
                        proc.pc += /** @type {OpCode_Fork_cont|OpCode_Fork_next} */ (code).next;
                    } else {
                        newProc.pc += /** @type {OpCode_Fork_cont|OpCode_Fork_next} */ (code).next;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_JUMP:
                    proc.pc += /** @type {OpCode_Jump} */ (code).cont;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_LINE_BEGIN :
                    c = prevIndex( input, proc.pos, this.unicode );
                    if( proc.pos !== 0 && !( this.multiline && isLineTerminator( c ) ) ){
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_LINE_END:
                    c = getIndex( input, proc.pos, this.unicode );
                    if( proc.pos !== input.length && !( this.multiline && isLineTerminator( c ) ) ){
                        backtrack = true;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_LOOP:
                    const n = proc.stack[ proc.stackSize - 1 ];
                    if( n > 0 ){
                        proc.pc += /** @type {OpCode_Loop} */ (code).cont;
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_MATCH:
                    return new Match( input, proc.caps, this.names );
                case REGEXP_COMPAT__OPCODE_IS_POP:
                    --proc.stackSize;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_PUSH:
                    proc.stack[ proc.stackSize++ ] = /** @type {OpCode_Push} */ (code).value;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_PUSH_POS:
                    proc.stack[ proc.stackSize++ ] = proc.pos;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_PUSH_PROC:
                    proc.stack[ proc.stackSize++ ] = procs.length;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_REF:
                    var begin = proc.caps[ /** @type {OpCode_Ref} */ (code).index * 2 ];
                    var end = proc.caps[ /** @type {OpCode_Ref} */ (code).index * 2 + 1 ];
                    var s = begin < 0 || end < 0 ? '' : input.slice( begin, end );
                    let i = 0;
                    while( i < s.length ){
                        const c = getIndex( input, proc.pos, this.unicode );
                        const d = getIndex( s, i, this.unicode );

                        const cc = this.ignoreCase ? canonicalize( c, this.unicode ) : c;
                        const dc = this.ignoreCase ? canonicalize( d, this.unicode ) : d;

                        if( cc !== dc ){
                            backtrack = true;
                            break;
                        };

                        proc.pos += size( c );
                        i += size( d );
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_REF_BACK:
                    var begin = proc.caps[ /** @type {OpCode_Ref_back} */ (code).index * 2 ];
                    var end = proc.caps[ /** @type {OpCode_Ref_back} */ (code).index * 2 + 1 ];
                    var s = begin < 0 || end < 0 ? '' : input.slice( begin, end );
                    var i = s.length;
                    while( i > 0 ){
                        const c = prevIndex( input, proc.pos, this.unicode );
                        const d = prevIndex( s, i, this.unicode );

                        const cc = this.ignoreCase ? canonicalize( c, this.unicode ) : c;
                        const dc = this.ignoreCase ? canonicalize( d, this.unicode ) : d;

                        if( cc !== dc ){
                            backtrack = true;
                            break;
                        };

                        proc.pos -= size( c );
                        i -= size( d );
                    };
                    break;
                case REGEXP_COMPAT__OPCODE_IS_RESTORE_POS:
                    proc.pos = proc.stack[ --proc.stackSize ];
                    break;
                case REGEXP_COMPAT__OPCODE_IS_REWIND_PROC:
                    procs.length = proc.stack[ --proc.stackSize ];
                    procs[ procs.length - 1 ] = proc;
                    break;
                case REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY:
                case REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY_NOT:
                    c = prevIndex( input, proc.pos, this.unicode );
                    var d = getIndex( input, proc.pos, this.unicode );
                    var set = this.unicode && this.ignoreCase ? charSetUnicodeWord : charSetWord;
                    var actual = set.has( c ) !== set.has( d );
                    var expected = code.op === REGEXP_COMPAT__OPCODE_IS_WORD_BOUNDARY;
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

        pos += size( getIndex( input, pos, this.unicode ) );
    };

    return null;
};

function Program_createProc( pos, captureParens, maxStackSize ){
    const caps = [];
    const capsLength = ( captureParens + 1 ) * 2;
    for( let i = 0; i < capsLength; ++i ){
        caps.push( -1 );
    };

    const stack = [];
    for( let i = 0; i < maxStackSize; ++i ){
        stack.push( 0 );
    };

    return new Proc( pos, 0, stack, 0, caps );
};
