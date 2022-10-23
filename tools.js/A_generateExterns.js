module.exports = function(){
    const matchPropertyValue = require( 'unicode-match-property-value-ecmascript' );

    const CATEGORY = require( './3_generateUnicodeCategory.js' ).CATEGORY;
    const UnicodeCategory = {};
    for( const name of CATEGORY ){
        const canonical = matchPropertyValue( 'General_Category', name );
        UnicodeCategory[ canonical ] = [ 0 ];
    };

    const propertyAliases = require( 'unicode-property-aliases-ecmascript' );
    const PROPERTY        = require( './4_generateUnicodeProperty.js' ).PROPERTY;
    const UnicodeProperty = {};
    for( const name of PROPERTY ){
        const canonical = propertyAliases.get( name ) ?? name;
        UnicodeProperty[ canonical ] = [ 0 ];
    };

    const mapPropertyAliases = require( 'unicode-property-aliases-ecmascript' );
    const UnicodePropertyAliases = {};
    for( const [ c, d ] of mapPropertyAliases ){
      UnicodePropertyAliases[ c ] = '';
    };

    const propertyValueAliases = require( 'unicode-property-value-aliases-ecmascript' ),
          mapGeneralCategory   = propertyValueAliases.get( 'General_Category'  ),
          mapScript            = propertyValueAliases.get( 'Script'            ),
          mapScriptExtensions  = propertyValueAliases.get( 'Script_Extensions' );
    const UnicodePropertyValueAliasesGeneralCategory = {};
    for( const [ c, d ] of mapGeneralCategory ){
        UnicodePropertyValueAliasesGeneralCategory[ c ] = '';
    };
    const UnicodePropertyValueAliasesScript = {};
    for( const [ c, d ] of mapScript ){
        UnicodePropertyValueAliasesScript[ c ] = '';
    };
    const UnicodePropertyValueAliasesScriptExtensions = {};
    for( const [ c, d ] of mapScriptExtensions ){
        UnicodePropertyValueAliasesScriptExtensions[ c ] = '';
    };

    const SCRIPT = require( './7_generateUnicodeScript.js' ).SCRIPT;
    const UnicodeScriptAndScriptExtensions = {};
    for( const name of SCRIPT ){
        const canonical = matchPropertyValue( 'Script', name );
        UnicodeScriptAndScriptExtensions[ canonical ] = [ 0 ];
    };

    return `
/** @const {!Global} */
var global;

/** @const {!Module} */
var module;

String.prototype.search = function(){};
String.prototype.split  = function(){};

var UnicodeCategory =
    ${JSON.stringify(UnicodeCategory)};

var UnicodeProperty =
    ${JSON.stringify(UnicodeProperty)};

var UnicodePropertyAliases =
    ${JSON.stringify(UnicodePropertyAliases)};

var UnicodePropertyValueAliasesGeneralCategory =
    ${JSON.stringify(UnicodePropertyValueAliasesGeneralCategory)};

var UnicodePropertyValueAliasesScript =
    ${JSON.stringify(UnicodePropertyValueAliasesScript)};

var UnicodePropertyValueAliasesScriptExtensions =
    ${JSON.stringify(UnicodePropertyValueAliasesScriptExtensions)};

var UnicodeScriptAndScriptExtensions =
    ${JSON.stringify(UnicodeScriptAndScriptExtensions)};
`;
};
