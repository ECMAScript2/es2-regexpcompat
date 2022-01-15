/** Cache for loaded `ChaeSet`. */
const Unicode_CACHE = {};

/** Load `CharSet` corresponding to Unicode `General_Category` value.
 * @param {string} v
 * @return {CharSet|undefined}
 */
function loadCategory( v ){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('General_Category');

    v = _v && _v.get( v ) || v;

    const key = 'General_Category.' + v;
    const cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    const data = category.get( v );
    if( !data ){
        return;
    };
    const set = new CharSet( data );
    Unicode_CACHE[ key ] = set;;
    return set;
};

/** Load `CharSet` corresponding to Unicode `Script` value.
 * @param {string} v
 * @return {CharSet|undefined}
 */
function loadScript(v){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('Script');

    v = _v && _v.get( v ) || v;

    const key = 'Script.' + v;
    const cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    const data = script.get( v );
    if( !data ){
        return;
    };
    const set = new CharSet( data );
    Unicode_CACHE[ key ] = set;;
    return set;
};

/** Load `CharSet` corresponding to Unicode `Script_Extensions` value.
 *
 * @param {string} v
 * @return {CharSet|undefined}
 */
function loadScriptExtensions( v ){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('Script_Extensions');

    v = _v && _v.get( v ) || v;

    const key = 'Script_Extensions.' + v;
    const cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    const baseSet = loadScript( v );
    if( !baseSet ){
        return;
    };
    const data = scriptExtensions.get( v );
    if( !data && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: Script_Extensions must contain each value of Script');
    };

    const extSet = new CharSet( data );
    const set = baseSet.clone();
    set.addCharSet( extSet );
    Unicode_CACHE[ key ] = set;
    return set;
};

/**
 * Load `CharSet` corresponding to Unicode property.
 *
 * Return `null` if property is invalid.
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchproperty-p.
 *
 * @param {string} p
 * @return {CharSet|undefined}
 */
function loadProperty( p ){
    // Canonicalize property name.
    p = unicodePropertyAliasesEcmascript.get( p ) || p;

    const cache = Unicode_CACHE[ p ];
    if( cache ){
        return cache;
    };

    const data = property.get( p );
    if( !data ){
        return;
    };

    const set = new CharSet( data );
    Unicode_CACHE[ p ] = set;
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
 * @return {CharSet|undefined}
 */
function loadPropertyValue( p, v ){
    // Canonicalize property name.
    p = unicodePropertyAliasesEcmascript.get( p ) || p;

    switch( p ){
        case 'General_Category':
            return loadCategory( v );
        case 'Script':
            return loadScript( v );
        case 'Script_Extensions':
            return loadScriptExtensions( v );

    };
};
