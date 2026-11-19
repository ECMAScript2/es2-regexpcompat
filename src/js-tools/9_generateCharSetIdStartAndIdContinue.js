module.exports = function( path ){
    const CharSet        = require( path ).CharSet;
    const mapIdStart     = require( 'unicode-12.0.0/Binary_Property/ID_Start/code-points.js' );
    const charSetIdStart = new CharSet();

    for( const c of mapIdStart ){
      charSetIdStart.add( c, c + 1 );
    };

    const mapIdContinue = require( 'unicode-12.0.0/Binary_Property/ID_Continue/code-points.js' );
    const charSetIdContinue = new CharSet();
    for( const c of mapIdContinue ){
        charSetIdContinue.add( c, c + 1 );
    };
    return `
goog.provide( 'vm.charSet.ID_Start' );
goog.provide( 'vm.charSet.ID_Continue' );

goog.requireType( 'vm.d.CharSet' );
goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.createCharSet' );
goog.require( 'vm.SUPPORT_ES2018' );
goog.require( 'vm.unicodeProperty' );

if( vm.DEFINE.DEBUG ){
    /** @package @const {!vm.d.CharSet} */
    vm.charSet.ID_Start = vm.createCharSet(
        vm.SUPPORT_ES2018 ?
            vm.unicodeProperty[ 'ID_Start' ]
            :
            [${charSetIdStart.data.join( ', ' )}]
    );
};
/** @package @const {!vm.d.CharSet} */
vm.charSet.ID_Continue = vm.createCharSet(
    vm.SUPPORT_ES2018 ?
        vm.unicodeProperty[ 'ID_Continue' ]
        :
        [${charSetIdContinue.data.join( ', ' )}]
);
`;
};
