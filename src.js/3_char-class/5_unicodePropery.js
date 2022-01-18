/** Cache for loaded `ChaeSet`. */
var Unicode_CACHE = {};

/** Load `CharSet` corresponding to Unicode `General_Category` value.
 * @param {string} v
 * @return {CharSet|undefined}
 */
m_loadCategory = function( v ){
    // Canonicalize value name.
    var _v = m_propertyValueAliasesGeneralCategory[ v ] || v;

    var key = 'General_Category.' + _v;
    var cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    var data = m_unicodeCategory[ _v ];
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
    var _v = m_propertyValueAliasesScript[ v ] || v;

    var key = 'Script.' + _v;
    var cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    var data = m_unicodeScript[ _v ];
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
    var _v = m_propertyValueAliasesScriptExtensions[ v ] || v;

    var key = 'Script_Extensions.' + _v;
    var cache = Unicode_CACHE[ key ];
    if( cache ){
        return cache;
    };

    var baseSet = loadScript( _v );
    if( !baseSet ){
        return;
    };
    var data = m_unicodeScriptExtensions[ _v ];
    if( !data ){
        return ( Unicode_CACHE[ key ] = baseSet.clone() );
        // throw new Error('BUG: Script_Extensions must contain each value of Script');
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
    p = m_propertyAliases[ p ] || p;

    var cache = Unicode_CACHE[ p ];
    if( cache ){
        return cache;
    };

    var data = m_unicodeProperty[ p ];
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
    // p = m_propertyAliases[ p ] || p;

    switch( p ){
        case 'gc' :
        case 'General_Category':
            return m_loadCategory( v );
        case 'sc' :
        case 'Script':
            return loadScript( v );
        case 'scx' :
        case 'Script_Extensions':
            return loadScriptExtensions( v );

    };
};
