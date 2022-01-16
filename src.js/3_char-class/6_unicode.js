/** Cache for loaded `ChaeSet`. */
var Unicode_CACHE = {};

/** Load `CharSet` corresponding to Unicode `General_Category` value.
 * @param {string} v
 * @return {CharSet|undefined}
 */
function loadCategory( v ){
    // Canonicalize value name.
    var _v = unicodePropertyValueAliasesEcmascript.get('General_Category');

    v = _v && _v.get( v ) || v;

    var key = 'General_Category.' + v;
    var cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    var data = category.get( v );
    if( !data ){
        return;
    };
    var set = new CharSet( data );
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

    var key = 'Script.' + v;
    var cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    var data = script.get( v );
    if( !data ){
        return;
    };
    var set = new CharSet( data );
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

    var key = 'Script_Extensions.' + v;
    var cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    var baseSet = loadScript( v );
    if( !baseSet ){
        return;
    };
    var data = scriptExtensions.get( v );
    if( !data && DEFINE_REGEXP_COMPAT__DEBUG ){
        throw new Error('BUG: Script_Extensions must contain each value of Script');
    };

    var extSet = new CharSet( data );
    var set = baseSet.clone();
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
m_loadProperty = function( p ){
    // Canonicalize property name.
    p = unicodePropertyAliasesEcmascript.get( p ) || p;

    var cache = Unicode_CACHE[ p ];
    if( cache ){
        return cache;
    };

    var data = property.get( p );
    if( !data ){
        return;
    };

    var set = new CharSet( data );
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
m_loadPropertyValue = function( p, v ){
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
