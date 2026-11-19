module.exports = function(){
    const mapPropertyAliases /* : Map<string, string> */ = require( 'unicode-property-aliases-ecmascript' );

    const objPropertyAliases = {};
    for( const [ c, d ] of mapPropertyAliases ){
      objPropertyAliases[ c ] = d;
    };

    return `
goog.provide( 'vm.propertyAliases' );

/** @package @const {!Object.<string, string>} */
` +
    'vm.propertyAliases = ' + JSON.stringify( objPropertyAliases, null, '    ' ) + ';';
};
