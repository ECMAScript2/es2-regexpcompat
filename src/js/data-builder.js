goog.provide( 'dataBuilder' );

goog.require( 'vm.createCharSet' );

module.exports[ 'CharSet' ] = function( data ){
    return vm.createCharSet( data || [] );
};
