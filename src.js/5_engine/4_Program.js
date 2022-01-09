function _nullishCoalesce$3(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }

/** Get `s[i]` code point. */
const index = (s, i, unicode) => {
  if (unicode) {
    return _nullishCoalesce$3(s.codePointAt(i), () => ( -1));
  }

  const c = s.charCodeAt(i);
  return Number.isNaN(c) ? -1 : c;
};

/** Get `s[i - 1]` code point. */
const prevIndex = (s, i, unicode) => {
  const c = index(s, i - 1, unicode);
  if (!unicode) {
    return c;
  }

  if (0xdc00 <= c && c <= 0xdfff) {
    const d = index(s, i - 2, unicode);
    if (0x10000 <= d && d <= 0x10ffff) {
      return d;
    }
  }

  return c;
};

/** Calculate code point size. */
const size = (c) => (c >= 0x10000 ? 2 : 1);

/** Check the code point is line terminator. */
const isLineTerminator = (c) =>
  c === 0x0a || c === 0x0d || c === 0x2028 || c === 0x2029;

/** Calculate the maximum stack size without execution. */
const calculateMaxStackSize = (codes) => {
  let stackSize = 0;
  let maxStackSize = 0;
  for (const code of codes) {
    switch (code.op) {
      case 'push':
      case 'push_pos':
      case 'push_proc':
        stackSize++;
        break;
      case 'empty_check':
      case 'pop':
      case 'restore_pos':
      case 'rewind_proc':
        stackSize--;
        break;
    }
    maxStackSize = Math.max(stackSize, maxStackSize);
  }
  return maxStackSize;
};

/** `Proc` is execution state of VM. */
class Proc {
  /** A current position of `input` string. */
  

  /** A program counter. */
  

  /**
   * A stack for matching.
   *
   * This stack can contain a position, a counter and a `proc` id.
   * Every values are integer value, so this type is an array of `number`.
   *
   * Note that this stack is allocated to available size before execution.
   * So, the real stack size is managed by `stackSize` property.
   */
  

  /** A current stack size. */
  

  /** A capture indexes. */
  

  constructor(pos, pc, stack, stackSize, caps) {
    this.pos = pos;
    this.pc = pc;
    this.stack = stack;
    this.stackSize = stackSize;
    this.caps = caps;
  }

  /** Clone this. */
   clone() {
    return new Proc(
      this.pos,
      this.pc,
      Array.from(this.stack),
      this.stackSize,
      Array.from(this.caps)
    );
  }
}

/**
 * `Program` is a container of compiled regular expreession.
 *
 * This can execute op-codes on VM also.
 */
class Program {
  /** A regular expression pattern. */
  

  /** An array of op-codes compiled `pattern`. */
  

  /** Pre-calculated maximum stack size. */
  

   get ignoreCase() {
    return this.pattern.flagSet.ignoreCase;
  }

   get multiline() {
    return this.pattern.flagSet.multiline;
  }

   get dotAll() {
    return this.pattern.flagSet.dotAll;
  }

   get unicode() {
    return this.pattern.flagSet.unicode;
  }

   get sticky() {
    return this.pattern.flagSet.sticky;
  }

   get captureParens() {
    return this.pattern.captureParens;
  }

   get names() {
    return this.pattern.names;
  }

  constructor(pattern, codes) {
    this.pattern = pattern;
    this.codes = codes;
    this.maxStackSize = calculateMaxStackSize(codes);
  }

   toString() {
    let s = '';
    const codes = codesToString(this.codes).split('\n').join('\n    ');
    s += 'Program {\n';
    s += `  pattern: ${patternToString(this.pattern)},\n`;
    s += '  codes:\n';
    s += `    ${codes}\n`;
    s += '}';
    return s;
  }

   [Symbol.for('nodejs.util.inspect.custom')](
    depth,
    options
  ) {
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
  }

   exec(input, pos = 0) {
    while (pos <= input.length) {
      const procs = [];
      procs.push(this.createProc(pos));

      while (procs.length > 0) {
        const proc = procs[procs.length - 1];
        const code = this.codes[proc.pc];
        let backtrack = false;
        proc.pc++;

        switch (code.op) {
          case 'any': {
            const c = index(input, proc.pos, this.unicode);
            if (c >= 0 && (this.dotAll || !isLineTerminator(c))) {
              proc.pos += size(c);
            } else {
              backtrack = true;
            }
            break;
          }

          case 'back': {
            const c = prevIndex(input, proc.pos, this.unicode);
            if (c >= 0) {
              proc.pos -= size(c);
            } else {
              backtrack = true;
            }
            break;
          }

          case 'cap_begin':
            proc.caps[code.index * 2] = proc.pos;
            break;

          case 'cap_end':
            proc.caps[code.index * 2 + 1] = proc.pos;
            break;

          case 'cap_reset':
            for (let i = code.from; i < code.to; i++) {
              proc.caps[i * 2] = proc.caps[i * 2 + 1] = -1;
            }
            break;

          case 'char': {
            const c = index(input, proc.pos, this.unicode);
            if (c < 0) {
              backtrack = true;
            }
            const cc = this.ignoreCase ? canonicalize(c, this.unicode) : c;
            if (cc === code.value) {
              proc.pos += size(c);
            } else {
              backtrack = true;
            }
            break;
          }

          case 'class':
          case 'class_not': {
            const c = index(input, proc.pos, this.unicode);
            if (c < 0) {
              backtrack = true;
              break;
            }
            const cc = this.ignoreCase ? canonicalize(c, this.unicode) : c;

            let actual = code.set.has(cc);
            const expected = code.op === 'class';

            if (this.ignoreCase) {
              for (const d of uncanonicalize(cc, this.unicode)) {
                actual = actual || code.set.has(d);
              }
            }

            if (actual === expected) {
              proc.pos += size(c);
            } else {
              backtrack = true;
            }
            break;
          }

          case 'dec':
            proc.stack[proc.stackSize - 1]--;
            break;

          case 'empty_check': {
            const pos = proc.stack[--proc.stackSize];
            if (pos === proc.pos) {
              backtrack = true;
            }
            break;
          }

          case 'fail':
            backtrack = true;
            break;

          case 'fork_cont':
          case 'fork_next': {
            const newProc = proc.clone();
            procs.push(newProc);
            if (code.op === 'fork_cont') {
              proc.pc += code.next;
            } else {
              newProc.pc += code.next;
            }
            break;
          }

          case 'jump':
            proc.pc += code.cont;
            break;

          case 'line_begin': {
            const c = prevIndex(input, proc.pos, this.unicode);
            if (proc.pos !== 0 && !(this.multiline && isLineTerminator(c))) {
              backtrack = true;
            }
            break;
          }

          case 'line_end': {
            const c = index(input, proc.pos, this.unicode);
            if (proc.pos !== input.length && !(this.multiline && isLineTerminator(c))) {
              backtrack = true;
            }
            break;
          }

          case 'loop': {
            const n = proc.stack[proc.stackSize - 1];
            if (n > 0) {
              proc.pc += code.cont;
            }
            break;
          }

          case 'match':
            return new Match(input, proc.caps, this.names);

          case 'pop':
            proc.stackSize--;
            break;

          case 'push':
            proc.stack[proc.stackSize++] = code.value;
            break;

          case 'push_pos':
            proc.stack[proc.stackSize++] = proc.pos;
            break;

          case 'push_proc':
            proc.stack[proc.stackSize++] = procs.length;
            break;

          case 'ref': {
            const begin = proc.caps[code.index * 2];
            const end = proc.caps[code.index * 2 + 1];
            const s = begin < 0 || end < 0 ? '' : input.slice(begin, end);
            let i = 0;
            while (i < s.length) {
              const c = index(input, proc.pos, this.unicode);
              const d = index(s, i, this.unicode);

              const cc = this.ignoreCase ? canonicalize(c, this.unicode) : c;
              const dc = this.ignoreCase ? canonicalize(d, this.unicode) : d;

              if (cc !== dc) {
                backtrack = true;
                break;
              }

              proc.pos += size(c);
              i += size(d);
            }
            break;
          }

          case 'ref_back': {
            const begin = proc.caps[code.index * 2];
            const end = proc.caps[code.index * 2 + 1];
            const s = begin < 0 || end < 0 ? '' : input.slice(begin, end);
            let i = s.length;
            while (i > 0) {
              const c = prevIndex(input, proc.pos, this.unicode);
              const d = prevIndex(s, i, this.unicode);

              const cc = this.ignoreCase ? canonicalize(c, this.unicode) : c;
              const dc = this.ignoreCase ? canonicalize(d, this.unicode) : d;

              if (cc !== dc) {
                backtrack = true;
                break;
              }

              proc.pos -= size(c);
              i -= size(d);
            }
            break;
          }

          case 'restore_pos':
            proc.pos = proc.stack[--proc.stackSize];
            break;

          case 'rewind_proc':
            procs.length = proc.stack[--proc.stackSize];
            procs[procs.length - 1] = proc;
            break;

          case 'word_boundary':
          case 'word_boundary_not': {
            const c = prevIndex(input, proc.pos, this.unicode);
            const d = index(input, proc.pos, this.unicode);
            const set = this.unicode && this.ignoreCase ? charSetUnicodeWord : charSetWord;
            const actual = set.has(c) !== set.has(d);
            const expected = code.op === 'word_boundary';
            if (actual !== expected) {
              backtrack = true;
            }
            break;
          }
        }

        if (backtrack) {
          procs.pop();
        }
      }

      if (this.sticky) {
        break;
      }

      pos += size(index(input, pos, this.unicode));
    }

    return null;
  }

   createProc(pos) {
    const caps = [];
    const capsLength = (this.captureParens + 1) * 2;
    for (let i = 0; i < capsLength; i++) {
      caps.push(-1);
    }

    const stack = [];
    for (let i = 0; i < this.maxStackSize; i++) {
      stack.push(0);
    }

    return new Proc(pos, 0, stack, 0, caps);
  }
}
