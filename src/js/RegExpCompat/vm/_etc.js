goog.provide( 'vm.SUPPORT_ES2015' );
goog.provide( 'vm.SUPPORT_ES2018' );
goog.provide( 'vm.str.fromCharCode' );
goog.provide( 'vm.math.floor' );
goog.provide( 'vm.math.min' );
goog.provide( 'vm.math.max' );

goog.require( 'vm.DEFINE.ES_FEATURE_VERSION' );

/** @const {boolean} */
vm.SUPPORT_ES2015 = 6 <= vm.DEFINE.ES_FEATURE_VERSION;

/** @const {boolean} */
vm.SUPPORT_ES2018 = 2018 <= vm.DEFINE.ES_FEATURE_VERSION;

/** @type {function(...number):string} */
vm.str.fromCharCode = String.fromCharCode;

/**
 * @param {number} n 
 * @return {number} */
vm.math.floor = function( n ){ return n <= 0x7FFFFFFF ? ( n | 0 ) : Math.floor( n ) };

/**
 * @param {number} n1 
 * @param {number} n2 
 * @return {number} */
vm.math.min = function( n1, n2 ){ return n1 < n2 ? n1 : n2 };

/**
 * @param {number} n1 
 * @param {number} n2 
 * @return {number} */
vm.math.max = function( n1, n2 ){ return n1 < n2 ? n2 : n1 };
