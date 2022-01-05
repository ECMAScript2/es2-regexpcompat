function _nullishCoalesce$2(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }
/** `Compiler` is a compiler for `Pattern` to `Program`. */
class Compiler {
  

   __init() {this.advance = false;}
   __init2() {this.captureParensIndex = 1;}
   __init3() {this.direction = 'forward';}

   get ignoreCase() {
    return this.pattern.flagSet.ignoreCase;
  }

   get unicode() {
    return this.pattern.flagSet.unicode;
  }

   get captureParens() {
    return this.pattern.captureParens;
  }

   get names() {
    return this.pattern.names;
  }

  constructor(pattern) {Compiler.prototype.__init.call(this);Compiler.prototype.__init2.call(this);Compiler.prototype.__init3.call(this);
    this.pattern = pattern;
  }

  /** Run compiler and return compiled `Program`. */
   compile() {
    const codes0 = this.compileNode(this.pattern.child);
    const codes1 = [
      { op: 'cap_begin', index: 0 },
      ...codes0,
      { op: 'cap_end', index: 0 },
      { op: 'match' },
    ];
    return new Program(this.pattern, codes1);
  }

   compileNode(node) {
    switch (node.type) {
      case 'Disjunction':
        return this.compileDisjunction(node);
      case 'Sequence':
        return this.compileSequence(node);
      case 'Capture':
        return this.compileCapture(node);
      case 'NamedCapture':
        return this.compileNamedCapture(node);
      case 'Group':
        return this.compileGroup(node);
      case 'Many':
        return this.compileMany(node);
      case 'Some':
        return this.compileSome(node);
      case 'Optional':
        return this.compileOptional(node);
      case 'Repeat':
        return this.compileRepeat(node);
      case 'WordBoundary':
        return this.compileWordBoundary(node);
      case 'LineBegin':
        return this.compileLineBegin(node);
      case 'LineEnd':
        return this.compileLineEnd(node);
      case 'LookAhead':
        return this.compileLookAhead(node);
      case 'LookBehind':
        return this.compileLookBehind(node);
      case 'Char':
        return this.compileChar(node);
      case 'EscapeClass':
        return this.compileEscapeClass(node);
      case 'Class':
        return this.compileClass(node);
      case 'Dot':
        return this.compileDot(node);
      case 'BackRef':
        return this.compileBackRef(node);
      case 'NamedBackRef':
        return this.compileNamedBackRef(node);
    }
  }

   compileDisjunction(node) {
    if (node.children.length === 0) {
      throw new Error('BUG: invalid pattern');
    }

    const children = [];
    let advance = true;
    for (const child of node.children) {
      children.push(this.compileNode(child));
      advance = advance && this.advance;
    }
    this.advance = advance;

    return children.reduceRight((codes, codes0) => [
      { op: 'fork_cont', next: codes0.length + 1 },
      ...codes0,
      { op: 'jump', cont: codes.length },
      ...codes,
    ]);
  }

   compileSequence(node) {
    const children = Array.from(node.children);
    if (this.direction === 'backward') {
      children.reverse();
    }

    const codes = [];
    let advance = false;
    for (const child of children) {
      const codes0 = this.compileNode(child);
      codes.push(...codes0);
      advance = advance || this.advance;
    }
    this.advance = advance;

    return codes;
  }

   compileGroup(node) {
    return this.compileNode(node.child);
  }

   compileCapture(node) {
    const codes0 = this.compileNode(node.child);
    if (node.index !== this.captureParensIndex++) {
      throw new Error('BUG: invalid pattern');
    }
    return [
      { op: this.direction === 'backward' ? 'cap_end' : 'cap_begin', index: node.index },
      ...codes0,
      { op: this.direction === 'backward' ? 'cap_begin' : 'cap_end', index: node.index },
    ];
  }

   compileNamedCapture(node) {
    const codes0 = this.compileNode(node.child);
    const index = this.names.get(node.name);
    if (index === undefined || index !== this.captureParensIndex++) {
      throw new Error('BUG: invalid pattern');
    }
    return [{ op: 'cap_begin', index }, ...codes0, { op: 'cap_end', index }];
  }

   compileMany(node) {
    const from = this.captureParensIndex;
    const codes0 = this.insertEmptyCheck(this.compileNode(node.child));
    const codes1 = this.insertCapReset(from, codes0);
    this.advance = false;

    return [
      { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length + 1 },
      ...codes1,
      { op: 'jump', cont: -1 - codes1.length - 1 },
    ];
  }

   compileSome(node) {
    const from = this.captureParensIndex;
    const codes0 = this.compileNode(node.child);
    const codes1 = this.insertCapReset(from, this.insertEmptyCheck(codes0));

    return [
      ...codes0,
      { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length + 1 },
      ...codes1,
      { op: 'jump', cont: -1 - codes1.length - 1 },
    ];
  }

   compileOptional(node) {
    const codes0 = this.compileNode(node.child);
    this.advance = false;

    return [{ op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes0.length }, ...codes0];
  }

   compileRepeat(node) {
    const from = this.captureParensIndex;
    const codes0 = this.compileNode(node.child);
    const codes = [];

    if (node.min === 1) {
      codes.push(...codes0);
    } else if (node.min > 1) {
      const codes1 = this.insertCapReset(from, codes0);
      codes.push(
        { op: 'push', value: node.min },
        ...codes1,
        { op: 'dec' },
        { op: 'loop', cont: -1 - codes1.length - 1 },
        { op: 'pop' }
      );
    } else {
      this.advance = false;
    }

    const max = _nullishCoalesce$2(node.max, () => ( node.min));
    if (max === Infinity) {
      const codes1 = this.insertCapReset(from, this.insertEmptyCheck(codes0));
      codes.push(
        { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length + 1 },
        ...codes1,
        { op: 'jump', cont: -1 - codes1.length - 1 }
      );
    } else if (max > node.min) {
      const remain = max - node.min;
      const codes1 = this.insertCapReset(from, this.insertEmptyCheck(codes0));
      if (remain === 1) {
        codes.push(
          { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes1.length },
          ...codes1
        );
      } else {
        codes.push(
          { op: 'push', value: remain + 1 },
          { op: node.nonGreedy ? 'fork_next' : 'fork_cont', next: codes0.length + 4 },
          ...codes1,
          { op: 'dec' },
          { op: 'loop', cont: -1 - codes0.length - 2 },
          { op: 'fail' },
          { op: 'pop' }
        );
      }
    }

    return codes;
  }

   insertEmptyCheck(codes0) {
    return this.advance ? codes0 : [{ op: 'push_pos' }, ...codes0, { op: 'empty_check' }];
  }

   insertCapReset(from, codes0) {
    if (from === this.captureParensIndex) {
      return codes0;
    }
    return [{ op: 'cap_reset', from, to: this.captureParensIndex }, ...codes0];
  }

   compileWordBoundary(node) {
    this.advance = false;
    return [{ op: node.invert ? 'word_boundary_not' : 'word_boundary' }];
  }

   compileLineBegin(_node) {
    this.advance = false;
    return [{ op: 'line_begin' }];
  }

   compileLineEnd(_node) {
    this.advance = false;
    return [{ op: 'line_end' }];
  }

   compileLookAhead(node) {
    const oldDirection = this.direction;
    this.direction = 'forward';
    const codes = this.compileLookAround(node);
    this.direction = oldDirection;
    return codes;
  }

   compileLookBehind(node) {
    const oldDirection = this.direction;
    this.direction = 'backward';
    const codes = this.compileLookAround(node);
    this.direction = oldDirection;
    return codes;
  }

   compileLookAround(node) {
    const codes0 = this.compileNode(node.child);
    this.advance = false;

    if (node.negative) {
      return [
        { op: 'push_pos' },
        { op: 'push_proc' },
        { op: 'fork_cont', next: codes0.length + 2 },
        ...codes0,
        { op: 'rewind_proc' },
        { op: 'fail' },
        { op: 'pop' },
        { op: 'restore_pos' },
      ];
    }

    return [
      { op: 'push_pos' },
      { op: 'push_proc' },
      ...codes0,
      { op: 'rewind_proc' },
      { op: 'restore_pos' },
    ];
  }

   compileChar(node) {
    let value = node.value;
    if (this.ignoreCase) {
      value = canonicalize(value, this.unicode);
    }
    this.advance = true;
    return this.insertBack([{ op: 'char', value }]);
  }

   compileEscapeClass(node) {
    const set = this.escapeClassToSet(node);
    this.advance = true;
    return this.insertBack([{ op: 'class', set }]);
  }

   compileClass(node) {
    const set = new CharSet();
    for (const item of node.children) {
      switch (item.type) {
        case 'Char':
          set.add(item.value, item.value + 1);
          break;
        case 'EscapeClass':
          set.addCharSet(this.escapeClassToSet(item));
          break;
        case 'ClassRange':
          set.add(item.children[0].value, item.children[1].value + 1);
          break;
      }
    }
    this.advance = true;
    return this.insertBack([{ op: node.invert ? 'class_not' : 'class', set }]);
  }

   escapeClassToSet(node) {
    switch (node.kind) {
      case 'digit':
        return node.invert ? charSetInvertDigit : charSetDigit;
      case 'word':
        if (this.unicode && this.ignoreCase) {
          return node.invert ? charSetInvertUnicodeWord : charSetUnicodeWord;
        }
        return node.invert ? charSetInvertWord : charSetWord;
      case 'space':
        return node.invert ? charSetInvertSpace : charSetSpace;
      case 'unicode_property': {
        const set =
          _nullishCoalesce$2(loadPropertyValue('General_Category', node.property), () => ( loadProperty(node.property)));
        if (set === null) {
          throw new RegExpSyntaxError('invalid Unicode property');
        }
        return node.invert ? set.clone().invert() : set;
      }
      case 'unicode_property_value': {
        const set = loadPropertyValue(node.property, node.value);
        if (set === null) {
          throw new RegExpSyntaxError('invalid Unicode property value');
        }
        return node.invert ? set.clone().invert() : set;
      }
    }
  }

   compileDot(_node) {
    this.advance = true;
    return this.insertBack([{ op: 'any' }]);
  }

   insertBack(codes) {
    if (this.direction === 'forward') {
      return codes;
    }
    return [{ op: 'back' }, ...codes, { op: 'back' }];
  }

   compileBackRef(node) {
    if (node.index < 1 || this.captureParens < node.index) {
      throw new Error('invalid back reference');
    }
    this.advance = false;
    return [{ op: this.direction === 'backward' ? 'ref_back' : 'ref', index: node.index }];
  }

   compileNamedBackRef(node) {
    const index = this.names.get(node.name);
    if (index === undefined || index < 1 || this.captureParens < index) {
      throw new Error('invalid named back reference');
    }
    this.advance = false;
    return [{ op: this.direction === 'backward' ? 'ref_back' : 'ref', index }];
  }
}
