function _nullishCoalesce$5(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }/** Type for whole regular expression pattern. */

/**
 * Escapes raw character for showing.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-escaperegexppattern.
 */
const escapeRaw = (raw) => {
  switch (raw) {
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\u2028':
      return '\\u2028';
    case '\u2029':
      return '\\u2029';
  }
  return raw;
};

/** Show class item as string. */
const classItemToString = (n) => {
  switch (n.type) {
    case 'Char':
      return escapeRaw(n.raw);
    case 'EscapeClass':
      switch (n.kind) {
        case 'digit':
          return n.invert ? '\\D' : '\\d';
        case 'word':
          return n.invert ? '\\W' : '\\w';
        case 'space':
          return n.invert ? '\\S' : '\\s';
        case 'unicode_property':
          return `\\${n.invert ? 'P' : 'p'}{${n.property}}`;
        case 'unicode_property_value':
          return `\\${n.invert ? 'P' : 'p'}{${n.property}=${n.value}}`;
      }
    // The above `switch-case` is exhaustive and it is checked by `tsc`, so `eslint` rule is disabled.
    // eslint-disable-next-line no-fallthrough
    case 'ClassRange':
      return `${escapeRaw(n.children[0].raw)}-${escapeRaw(n.children[1].raw)}`;
  }
};

/** Show node as string. */
const nodeToString = (n) => {
  switch (n.type) {
    case 'Sequence':
      return n.children.map(nodeToString).join('');
    case 'Disjunction':
      return n.children.map(nodeToString).join('|');
    case 'Capture':
      return `(${nodeToString(n.child)})`;
    case 'NamedCapture':
      return `(?<${n.raw}>${nodeToString(n.child)})`;
    case 'Group':
      return `(?:${nodeToString(n.child)})`;
    case 'Many':
      return `${nodeToString(n.child)}*${n.nonGreedy ? '?' : ''}`;
    case 'Some':
      return `${nodeToString(n.child)}+${n.nonGreedy ? '?' : ''}`;
    case 'Optional':
      return `${nodeToString(n.child)}?${n.nonGreedy ? '?' : ''}`;
    case 'Repeat': {
      let s = nodeToString(n.child);
      s += `{${n.min}`;
      if (n.max === Infinity) {
        s += ',';
      } else if ((_nullishCoalesce$5(n.max, () => ( n.min))) != n.min) {
        s += `,${n.max}`;
      }
      s += '}' + (n.nonGreedy ? '?' : '');
      return s;
    }
    case 'WordBoundary':
      return n.invert ? '\\B' : '\\b';
    case 'LineBegin':
      return '^';
    case 'LineEnd':
      return '$';
    case 'LookAhead':
      return `(?${n.negative ? '!' : '='}${nodeToString(n.child)})`;
    case 'LookBehind':
      return `(?<${n.negative ? '!' : '='}${nodeToString(n.child)})`;
    case 'Char': {
      const c = escapeRaw(n.raw);
      return c === '/' ? '\\/' : c;
    }
    case 'EscapeClass':
      return classItemToString(n);
    case 'Class':
      return `[${n.invert ? '^' : ''}${n.children.map(classItemToString).join('')}]`;
    case 'Dot':
      return '.';
    case 'BackRef':
      return `\\${n.index}`;
    case 'NamedBackRef':
      return `\\k<${n.raw}>`;
  }
};

/** Show flag set as string. */
const flagSetToString = (set) => {
  let s = '';
  if (set.global) {
    s += 'g';
  }
  if (set.ignoreCase) {
    s += 'i';
  }
  if (set.multiline) {
    s += 'm';
  }
  if (set.dotAll) {
    s += 's';
  }
  if (set.unicode) {
    s += 'u';
  }
  if (set.sticky) {
    s += 'y';
  }
  return s;
};

/** Show pattern as string. */
const patternToString = (p) => {
  let s = '/';
  const n = nodeToString(p.child);
  s += n === '' ? '(?:)' : n;
  s += '/';
  s += flagSetToString(p.flagSet);
  return s;
};
