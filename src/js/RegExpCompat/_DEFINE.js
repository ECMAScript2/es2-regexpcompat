goog.provide( 'vm.DEFINE.DEBUG' );
goog.provide( 'vm.DEFINE.MINIFY' );
goog.provide( 'vm.DEFINE.CLIENT_MIN_ES_VERSION' );
goog.provide( 'vm.DEFINE.ES_FEATURE_VERSION' );

/** @define {boolean} */
vm.DEFINE.DEBUG  = goog.define( 'vm.DEFINE.DEBUG', false );
/** @define {boolean} */
vm.DEFINE.MINIFY = goog.define( 'vm.DEFINE.MINIFY', true );
/** @define {number} */
vm.DEFINE.CLIENT_MIN_ES_VERSION = goog.define( 'vm.DEFINE.CLIENT_MIN_ES_VERSION', 2 ); // 2, 3, 5, 6(2015), 2018
/** @define {number} */
vm.DEFINE.ES_FEATURE_VERSION    = goog.define( 'vm.DEFINE.ES_FEATURE_VERSION', 2018 ); //    3, 5, 6(2015), 2018

if(
    vm.DEFINE.CLIENT_MIN_ES_VERSION !== 2 &&
    vm.DEFINE.CLIENT_MIN_ES_VERSION !== 3 &&
    vm.DEFINE.CLIENT_MIN_ES_VERSION !== 5 &&
    vm.DEFINE.CLIENT_MIN_ES_VERSION !== 6 &&
    vm.DEFINE.CLIENT_MIN_ES_VERSION !== 2015 &&
    vm.DEFINE.CLIENT_MIN_ES_VERSION !== 2018
){
      throw 'Invalid vm.DEFINE.CLIENT_MIN_ES_VERSION(=2|3|5|6|2015|2018) value! ' + vm.DEFINE.CLIENT_MIN_ES_VERSION;
};

if( 
    vm.DEFINE.ES_FEATURE_VERSION !== 3 &&
    vm.DEFINE.ES_FEATURE_VERSION !== 5 &&
    vm.DEFINE.ES_FEATURE_VERSION !== 6 &&
    vm.DEFINE.ES_FEATURE_VERSION !== 2015 &&
    vm.DEFINE.ES_FEATURE_VERSION !== 2018
){
    throw 'Invalid vm.DEFINE.ES_FEATURE_VERSION(=3|5|6|2015|2018) value! ' + vm.DEFINE.ES_FEATURE_VERSION;
};
