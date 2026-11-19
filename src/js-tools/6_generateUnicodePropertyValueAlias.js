module.exports = function(){
    const propertyValueAliases = require( 'unicode-property-value-aliases-ecmascript' ),
          mapGeneralCategory   = propertyValueAliases.get( 'General_Category'  ),
          mapScript            = propertyValueAliases.get( 'Script'            ),
          mapScriptExtensions  = propertyValueAliases.get( 'Script_Extensions' );

    const objGeneralCategory = {};
    for( const [ c, d ] of mapGeneralCategory ){
        objGeneralCategory[ c ] = d;
    };

    const objScript = {};
    for( const [ c, d ] of mapScript ){
        objScript[ c ] = d;
    };

    const objScriptExtensions = {};
    for( const [ c, d ] of mapScriptExtensions ){
        objScriptExtensions[ c ] = d;
    };
    return `
goog.provide( 'vm.propertyValueAliasesGeneralCategory' );
goog.provide( 'vm.propertyValueAliasesScript' );
goog.provide( 'vm.propertyValueAliasesScriptExtensions' );

` +
        '/** @package @const {!Object.<string, string>} */\n' +
        'vm.propertyValueAliasesGeneralCategory = '  + JSON.stringify( objGeneralCategory , null, '    ' ) + ';\n' +
        '/** @package @const {!Object.<string, string>} */\n' +
        'vm.propertyValueAliasesScript = '           + JSON.stringify( objScript          , null, '    ' ) + ';\n' +
        '/** @package @const {!Object.<string, string>} */\n' +
        'vm.propertyValueAliasesScriptExtensions = ' + JSON.stringify( objScriptExtensions, null, '    ' ) + ';\n';
};
