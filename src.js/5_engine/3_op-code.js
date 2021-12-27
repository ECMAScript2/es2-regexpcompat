/** `OpCode` is a type of op-codes. */






























/** Show op-codes as string. */
const codesToString = (codes) => {
  const pc = (i) => `#${i.toString().padStart(3, '0')}`;
  const op = (s) => s.padEnd(13, ' ');

  const lines = codes.map((code, lineno) => {
    let line = `${pc(lineno)}: ${op(code.op)}`;

    switch (code.op) {
      case 'cap_begin':
      case 'cap_end':
        line += `${code.index}`;
        break;
      case 'cap_reset':
        line += `${code.from} ${code.to}`;
        break;
      case 'char':
        line += `'${escapeCodePointAsRegExpSpurceChar(code.value)}'`;
        break;
      case 'class':
      case 'class_not':
        line += `${code.set.toRegExpPattern(code.op === 'class_not')}`;
        break;
      case 'fork_cont':
      case 'fork_next':
        line += `${pc(lineno + 1 + code.next)}`;
        break;
      case 'jump':
      case 'loop':
        line += `${pc(lineno + 1 + code.cont)}`;
        break;
      case 'push':
        line += `${code.value}`;
        break;
      case 'ref':
      case 'ref_back':
        line += `${code.index}`;
        break;
    }

    return line;
  });

  return lines.join('\n');
};

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
