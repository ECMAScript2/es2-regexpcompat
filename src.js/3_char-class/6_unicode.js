/** Cache for loaded `ChaeSet`. */
const Unicode_CACHE = {};

/** Load `CharSet` corresponding to Unicode `General_Category` value.
 * @param {string} v
 * @return {CharSet|null}
 */
function loadCategory( v ){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('General_Category');

    v = _v && _v.get( v ) || v;

    const key = `General_Category.${v}`;
    const cache = Unicode_CACHE.get(key);
    if( cache ){
        return cache;
    };

    const data = category.get(v);
    if( !data ){
        return null;
    };
    const set = new CharSet(data);
    Unicode_CACHE.set(key, set);
    return set;
};

/** Load `CharSet` corresponding to Unicode `Script` value.
 * @param {string} v
 * @return {CharSet|null}
 */
function loadScript(v){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('Script');

    v = _v && _v.get( v ) || v;

    const key = `Script.${v}`;
    const cache = Unicode_CACHE.get(key);
    if( cache ){
        return cache;
    };

    const data = script.get(v);
    if( !data ){
        return null;
    };
    const set = new CharSet(data);
    Unicode_CACHE.set(key, set);
    return set;
};

/** Load `CharSet` corresponding to Unicode `Script_Extensions` value.
 * @param {string} v
 * @return {CharSet|null}
 */
function loadScriptExtensions(v){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('Script_Extensions');

    v = _v && _v.get( v ) || v;

    const key = `Script_Extensions.${v}`;
    const cache = Unicode_CACHE.get(key);
    if( cache ){
        return cache;
    };

    const baseSet = loadScript(v);
    if( !baseSet ){
        return null;
    };
    const data = scriptExtensions.get(v);
    if( !data ){
        throw new Error('BUG: Script_Extensions must contain each value of Script');
    };

    const extSet = new CharSet(data);
    const set = baseSet.clone();
    set.addCharSet(extSet);
    Unicode_CACHE.set(key, set);
    return set;
};

/**
 * Load `CharSet` corresponding to Unicode property.
 *
 * Return `null` if property is invalid.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchproperty-p.
 */
function loadProperty(p){
    // Canonicalize property name.
    p = unicodePropertyAliasesEcmascript.get(p) || p;

    const cache = Unicode_CACHE.get(p);
    if (cache) {
        return cache;
    }

    const data = property.get(p);
    if (!data) {
        return null;
    }

    const set = new CharSet(data);
    Unicode_CACHE.set(p, set);
    return set;
};

/**
 * Load `CharSet` corresponding to Unicode property and value.
 *
 * Return `null` if property or value is invalid.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchpropertyvalue-p-v.
 * @param {string} p
 * @param {string} v
 * @return {CharSet|null}
 */
function loadPropertyValue( p, v ){
    // Canonicalize property name.
    p = unicodePropertyAliasesEcmascript.get(p) || p;

    switch( p ){
        case 'General_Category':
            return loadCategory(v);
        case 'Script':
            return loadScript(v);
        case 'Script_Extensions':
            return loadScriptExtensions(v);
        default:
            return null;
    };
};
