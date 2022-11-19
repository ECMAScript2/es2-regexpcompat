module.exports = function(){
    const mapPropertyAliases /* : Map<string, string> */ = require( 'unicode-property-aliases-ecmascript' );

    const objPropertyAliases = {};
    for( const [ c, d ] of mapPropertyAliases ){
      objPropertyAliases[ c ] = d;
    };

    return 'm_propertyAliases = ' + JSON.stringify( objPropertyAliases, null, '    ' ) + ';';
};
