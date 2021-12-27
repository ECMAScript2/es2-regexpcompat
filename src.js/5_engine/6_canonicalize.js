function _nullishCoalesce$6(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }
/** Return case-folded code point for ignore-case comparison. */
const canonicalize = (c, unicode) => {
  if (unicode) {
    return foldMap.get(c) || c;
  }

  const s = String.fromCharCode(c);
  const u = s.toUpperCase();
  if (u.length >= 2) {
    return c;
  }
  const d = u.charCodeAt(0);
  if (c >= 0x80 && d < 0x80) {
    return c;
  }
  return d;
};

/**
 * Inverse function of `canonicalize`.
 *
 * It is used for character class matching on ignore-case.
 */
const uncanonicalize = (c, unicode) => {
  if (unicode) {
    return _nullishCoalesce$6(inverseFoldMap$1.get(c), () => ( []));
  }

  const d = inverseFoldMap.get(c);
  if (d !== undefined) {
    return d;
  }
  const s = String.fromCharCode(c);
  return [s.toLowerCase().charCodeAt(0)];
};
