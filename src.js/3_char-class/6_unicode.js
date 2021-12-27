function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
/** Cache for loaded `ChaeSet`. */
const CACHE = new Map();

/** Load `CharSet` corresponding to Unicode `General_Category` value. */
const loadCategory = (v) => {
  // Canonicalize value name.
  v = _optionalChain$1([unicodePropertyValueAliasesEcmascript, 'access', _ => _.get, 'call', _2 => _2('General_Category'), 'optionalAccess', _3 => _3.get, 'call', _4 => _4(v)]) || v;

  const key = `General_Category.${v}`;
  const cache = CACHE.get(key);
  if (cache) {
    return cache;
  }

  const data = category.get(v);
  if (!data) {
    return null;
  }
  const set = new CharSet(data);
  CACHE.set(key, set);
  return set;
};

/** Load `CharSet` corresponding to Unicode `Script` value. */
const loadScript = (v) => {
  // Canonicalize value name.
  v = _optionalChain$1([unicodePropertyValueAliasesEcmascript, 'access', _5 => _5.get, 'call', _6 => _6('Script'), 'optionalAccess', _7 => _7.get, 'call', _8 => _8(v)]) || v;

  const key = `Script.${v}`;
  const cache = CACHE.get(key);
  if (cache) {
    return cache;
  }

  const data = script.get(v);
  if (!data) {
    return null;
  }
  const set = new CharSet(data);
  CACHE.set(key, set);
  return set;
};

/** Load `CharSet` corresponding to Unicode `Script_Extensions` value. */
const loadScriptExtensions = (v) => {
  // Canonicalize value name.
  v = _optionalChain$1([unicodePropertyValueAliasesEcmascript, 'access', _9 => _9.get, 'call', _10 => _10('Script_Extensions'), 'optionalAccess', _11 => _11.get, 'call', _12 => _12(v)]) || v;

  const key = `Script_Extensions.${v}`;
  const cache = CACHE.get(key);
  if (cache) {
    return cache;
  }

  const baseSet = loadScript(v);
  if (!baseSet) {
    return null;
  }
  const data = scriptExtensions.get(v);
  if (!data) {
    throw new Error('BUG: Script_Extensions must contain each value of Script');
  }

  const extSet = new CharSet(data);
  const set = baseSet.clone();
  set.addCharSet(extSet);
  CACHE.set(key, set);
  return set;
};

/**
 * Load `CharSet` corresponding to Unicode property.
 *
 * Return `null` if property is invalid.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchproperty-p.
 */
const loadProperty = (p) => {
  // Canonicalize property name.
  p = unicodePropertyAliasesEcmascript.get(p) || p;

  const cache = CACHE.get(p);
  if (cache) {
    return cache;
  }

  const data = property.get(p);
  if (!data) {
    return null;
  }

  const set = new CharSet(data);
  CACHE.set(p, set);
  return set;
};

/**
 * Load `CharSet` corresponding to Unicode property and value.
 *
 * Return `null` if property or value is invalid.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchpropertyvalue-p-v.
 */
const loadPropertyValue = (p, v) => {
  // Canonicalize property name.
  p = unicodePropertyAliasesEcmascript.get(p) || p;

  switch (p) {
    case 'General_Category':
      return loadCategory(v);
    case 'Script':
      return loadScript(v);
    case 'Script_Extensions':
      return loadScriptExtensions(v);
    default:
      return null;
  }
};
