function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/* eslint-disable @typescript-eslint/no-explicit-any */

const isRegExp = (argument) => {
  if (argument && typeof argument === 'object') {
    return !!(argument )[Symbol.match];
  }
  return false;
};

const advance = (s, i, unicode) => {
  if (!unicode || i + 1 >= s.length) {
    return i + 1;
  }
  const c = _nullishCoalesce(s.codePointAt(i), () => ( 0));
  if (0x10000 <= c) {
    return i + 2;
  }
  return i + 1;
};

const RegExpCompat = (() => {
  




  const klass = function RegExpCompat( source, flags) {
    if (/*new.target === undefined*/ !this || this.constructor !== RegExpCompat) {
      if (isRegExp(source) && flags === undefined) {
        if (source.constructor === RegExpCompat) {
          return source;
        }
      }
      return new (klass )(source, flags);
    }

    if (source instanceof RegExp || source instanceof RegExpCompat) {
      if (flags === undefined) {
        flags = (source ).flags;
      }
      source = (source ).source;
    }
    source = String(source);

    const parser = new Parser(source, flags, true);
    this.pattern = parser.parse();
    const compiler = new Compiler(this.pattern);
    this.program = compiler.compile();
    return this;
  };

  for (const name of ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', 'lastMatch']) {
    Object.defineProperty(klass, name, {
      get() {
        throw new Error(`RegExpCompat does not support old RegExp.${name} method`);
      },
    });
  }

  klass[Symbol.species] = klass;

  Object.defineProperty(klass.prototype, 'source', {
    get() {
      const n = nodeToString(this.pattern.child);
      return n === '' ? '(?:)' : n;
    },
  });

  Object.defineProperty(klass.prototype, 'flags', {
    get() {
      return flagSetToString(this.pattern.flagSet);
    },
  });

  for (const flag of [
    'global',
    'ignoreCase',
    'multiline',
    'dotAll',
    'unicode',
    'sticky',
  ] ) {
    Object.defineProperty(klass.prototype, flag, {
      get() {
        return this.pattern.flagSet[flag];
      },
    });
  }

  klass.prototype.compile = function compile() {
    return this;
  };

  klass.prototype.toString = function toString() {
    return patternToString(this.pattern);
  };

  klass.prototype.exec = function exec( string) {
    const update = this.global || this.sticky;

    let pos = 0;
    if (update) {
      pos = this.lastIndex;
    }
    const match = this.program.exec(string, pos);
    if (update) {
      this.lastIndex = _nullishCoalesce(_optionalChain([match, 'optionalAccess', _ => _.lastIndex]), () => ( 0));
    }

    return _nullishCoalesce(_optionalChain([match, 'optionalAccess', _2 => _2.toArray, 'call', _3 => _3()]), () => ( null));
  };

  klass.prototype.test = function test( string) {
    return !!this.exec(string);
  };

  klass.prototype[Symbol.match] = function (
    
    string
  ) {
    if (this.global) {
      this.lastIndex = 0;
      const result = [];
      for (;;) {
        const r = this.exec(string);
        if (r) {
          result.push(r[0]);
          if (r[0] === '') {
            this.lastIndex = advance(string, this.lastIndex, this.unicode);
          }
        } else {
          break;
        }
      }
      return result.length === 0 ? null : result;
    }
    return this.exec(string);
  };

  klass.prototype[Symbol.replace] = function (
    
    string,
    replacer
  ) {
    const matches = [];
    if (this.global) {
      this.lastIndex = 0;
    }

    // Collect matches to replace.
    // It must be done before building result string because
    // the replacer function calls `this.exec` and changes `this.lastIndex` maybe.
    for (;;) {
      const match = this.exec(string);
      if (!match) {
        break;
      }
      matches.push(match);
      if (!this.global) {
        break;
      }
      if (match[0] === '') {
        this.lastIndex = advance(string, this.lastIndex, this.unicode);
      }
    }

    // Build a result string.
    let pos = 0;
    let result = '';
    for (const match of matches) {
      result += string.slice(pos, match.index);
      pos = match.index + match[0].length;
      if (typeof replacer === 'function') {
        const args = [match[0], ...match.slice(1), match.index, string] ;
        if (match.groups) {
          args.push(match.groups);
        }
        result += String(replacer(...args));
      } else {
        let i = 0;
        for (;;) {
          const j = replacer.indexOf('$', i);
          result += replacer.slice(i, j === -1 ? string.length : j);
          if (j === -1) {
            break;
          }
          const c = replacer[j + 1];
          switch (c) {
            case '$':
              i = j + 2;
              result += '$';
              break;
            case '&':
              i = j + 2;
              result += match[0];
              break;
            case '`':
              i = j + 2;
              result += string.slice(0, match.index);
              break;
            case "'":
              i = j + 2;
              result += string.slice(pos);
              break;
            case '<': {
              const k = replacer.indexOf('>', j + 2);
              if (this.pattern.names.size === 0 || k === -1) {
                i = j + 2;
                result += '$<';
                break;
              }
              const name = replacer.slice(j + 2, k);
              result += _nullishCoalesce((match.groups && match.groups[name]), () => ( ''));
              i = k + 1;
              break;
            }
            default: {
              if ('0' <= c && c <= '9') {
                const d = replacer[j + 2];
                const s = '0' <= d && d <= '9' ? c + d : c;
                let n = Number.parseInt(s, 10);
                if (0 < n && n < match.length) {
                  result += _nullishCoalesce(match[n], () => ( ''));
                  i = j + 1 + s.length;
                  break;
                }
                n = Math.floor(n / 10);
                if (0 < n && n < match.length) {
                  result += _nullishCoalesce(match[n], () => ( ''));
                  i = j + s.length;
                  break;
                }
              }
              result += '$';
              i = j + 1;
              break;
            }
          }
        }
      }
    }

    result += string.slice(pos);
    return result;
  };

  klass.prototype[Symbol.search] = function ( string) {
    const prevLastIndex = this.lastIndex;
    this.lastIndex = 0;
    const m = this.exec(string);
    this.lastIndex = prevLastIndex;
    return _nullishCoalesce((m && m.index), () => ( -1));
  };

  klass.prototype[Symbol.split] = function (
    
    string,
    limit
  ) {
    const flags = this.sticky ? this.flags : this.flags + 'y';
    const constructor = this.constructor;
    const species = _nullishCoalesce((constructor && constructor[Symbol.species]), () => ( klass));
    const splitter = new species(this.source, flags);
    limit = (_nullishCoalesce(limit, () => ( 2 ** 32 - 1))) >>> 0;

    const result = [];
    if (limit === 0) {
      return result;
    }

    // Special case for empty string.
    if (string.length === 0) {
      const match = splitter.exec(string);
      if (match === null) {
        result.push(string);
      }
      return result;
    }

    let p = 0;
    let q = p;
    while (q < string.length) {
      splitter.lastIndex = q;
      const match = splitter.exec(string);
      if (match === null) {
        q = advance(string, q, this.unicode);
        continue;
      }

      const e = Math.min(splitter.lastIndex, string.length);
      if (e === p) {
        q = advance(string, q, this.unicode);
        continue;
      }

      const t = string.slice(p, q);
      result.push(t);
      if (limit === result.length) {
        return result;
      }
      p = e;
      for (let i = 1; i < match.length; i++) {
        result.push(match[i]);
        if (limit === result.length) {
          return result;
        }
      }

      q = p;
    }

    const t = string.slice(p);
    result.push(t);
    return result;
  };

  return klass ;
})();

window[ 'RegExpCompat' ] = RegExpCompat;
