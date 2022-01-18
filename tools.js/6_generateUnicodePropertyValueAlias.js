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
    return '' +
        'm_propertyValueAliasesGeneralCategory = '  + JSON.stringify( objGeneralCategory , null, '    ' ) + ';\n' +
        'm_propertyValueAliasesScript = '           + JSON.stringify( objScript          , null, '    ' ) + ';\n' +
        'm_propertyValueAliasesScriptExtensions = ' + JSON.stringify( objScriptExtensions, null, '    ' ) + ';\n';
};
