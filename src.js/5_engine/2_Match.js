function _nullishCoalesce$4(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }

/** `Match` is result data of regular expression pattern matching. */
class Match {
  /** An input string of this matching. */
  

  
  

  constructor(input, caps, names) {
    this.input = input;
    this.caps = caps;
    this.names = names;
  }

  /** Return the initial index of this matching. */
   get index() {
    return this.caps[0];
  }

  /** Return the last index of this matching. */
   get lastIndex() {
    return this.caps[1];
  }

  /**
   * Return number of capture group.
   *
   * This number contains capture `0` (whole matching) also.
   */
   get length() {
    return this.caps.length / 2;
  }

  /** Get the capture `k`. */
   get(k) {
    const [i, j] = this.resolve(k);
    if (i < 0 || j < 0) {
      return undefined;
    }

    return this.input.slice(i, j);
  }

  /** Get the begin index of the capture `k`. */
   begin(k) {
    const i = this.resolve(k)[0];
    return i < 0 ? undefined : i;
  }

  /** Get the end index of the capture `k`. */
   end(k) {
    const j = this.resolve(k)[1];
    return j < 0 ? undefined : j;
  }

  /**
   * Resolve name to capture index.
   *
   * If not resolved, it returns `-1`.
   */
   resolve(k) {
    if (typeof k === 'string') {
      k = _nullishCoalesce$4(this.names.get(k), () => ( -1));
    }
    return [_nullishCoalesce$4(this.caps[k * 2], () => ( -1)), _nullishCoalesce$4(this.caps[k * 2 + 1], () => ( -1))];
  }

  /** Convert this into `RegExp`'s result array. */
   toArray() {
    // In TypeScript definition, `RegExpExecArray` extends `string[]`.
    // However the **real** `RegExpExecArray` can contain `undefined`.
    // So this method uses type casting to set properties.

    const array = [];
    (array ).index = this.index;
    (array ).input = this.input;
    array.length = this.length;

    for (let i = 0; i < this.length; i++) {
      array[i] = this.get(i);
    }

    if (this.names.size > 0) {
      const groups = Object.create(null);
      for (const [name, i] of this.names) {
        groups[name] = array[i];
      }

      // `RegExpExecArray`'s group does not accept `undefined` value, so cast to `any` for now.
      (array ).groups = groups; // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      (array ).groups = undefined;
    }

    return array ;
  }

   toString() {
    const array = this.toArray();
    const show = (x) =>
      x === undefined ? 'undefined' : JSON.stringify(x);
    return `Match[${array.map(show).join(', ')}]`;
  }

   [Symbol.for('nodejs.util.inspect.custom')](
    depth,
    options
  ) {
    let s = `${options.stylize('Match', 'special')} [\n`;
    const inverseNames = new Map(Array.from(this.names).map(([k, i]) => [i, k]));
    for (let i = 0; i < this.length; i++) {
      const name = options.stylize(
        JSON.stringify(_nullishCoalesce$4(inverseNames.get(i), () => ( i))),
        inverseNames.has(i) ? 'string' : 'number'
      );
      let capture = this.get(i);
      if (capture === undefined) {
        s += `  ${name} => ${options.stylize('undefined', 'undefined')},\n`;
        continue;
      }
      const begin = options.stylize(this.caps[i * 2].toString(), 'number');
      const end = options.stylize(this.caps[i * 2 + 1].toString(), 'number');
      capture = options.stylize(JSON.stringify(capture), 'string');
      s += `  ${name} [${begin}:${end}] => ${capture},\n`;
    }
    s += ']';
    return s;
  }
}
