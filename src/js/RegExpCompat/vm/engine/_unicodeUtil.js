goog.provide( 'vm.loadCategory' );
goog.provide( 'vm.loadProperty' );
goog.provide( 'vm.loadPropertyValue' );
goog.provide( 'vm.canonicalize' );
goog.provide( 'vm.uncanonicalize' );

goog.requireType( 'vm.d.CharSet' );
goog.require( 'vm.createCharSet' );
goog.require( 'vm.SUPPORT_ES2018' );
goog.require( 'vm.propertyValueAliasesScript' );
goog.require( 'vm.propertyValueAliasesScriptExtensions' );
goog.require( 'vm.unicodeScript' );
goog.require( 'vm.propertyValueAliasesGeneralCategory' );
goog.require( 'vm.unicodeScriptExtensions' );
goog.require( 'vm.unicodeCategory' );
goog.require( 'vm.propertyAliases' );
goog.require( 'vm.unicodeProperty' );
goog.require( 'vm.unicodeFoldMap' );
goog.require( 'vm.unicodeInverseFoldMap' );
goog.require( 'vm.legacyFoldMap' );
goog.require( 'vm.str.fromCharCode' );

goog.scope(
    function(){
        /** Load `CharSet` corresponding to Unicode `Script` value.
         * @param {string} v
         * @return {!vm.d.CharSet | void} */
        function _loadScript(v){
            // Canonicalize value name.
            var _v = vm.propertyValueAliasesScript[ v ] || v;

            var key = 'Script.' + _v;
            var cache = _UNICODE_CACHE[ key ];
            if( cache ){
                return cache;
            };

            var data = vm.unicodeScript[ _v ];
            if( !data ){
                return;
            };
            var set = vm.createCharSet( data );
            _UNICODE_CACHE[ key ] = set;
            return set;
        };

        /** Load `CharSet` corresponding to Unicode `Script_Extensions` value.
         * @param {string} v
         * @return {!vm.d.CharSet | void} */
        function _loadScriptExtensions( v ){
            // Canonicalize value name.
            var _v = vm.propertyValueAliasesScriptExtensions[ v ] || v;

            var key = 'Script_Extensions.' + _v;
            var cache = _UNICODE_CACHE[ key ];
            if( cache ){
                return cache;
            };

            var baseSet = _loadScript( _v );
            if( !baseSet ){
                return;
            };
            var data = vm.unicodeScriptExtensions[ _v ];
            if( !data ){
                return ( _UNICODE_CACHE[ key ] = baseSet.clone() );
                // throw new Error('BUG: Script_Extensions must contain each value of Script');
            };

            var extSet = vm.createCharSet( data );
            var set = baseSet.clone();
            set.addCharSet( extSet );
            _UNICODE_CACHE[ key ] = set;
            return set;
        };

        /** Cache for loaded `ChaeSet`.
         * @const {!Object.<string, !vm.d.CharSet>} */
        var _UNICODE_CACHE = {};

        /** Load `CharSet` corresponding to Unicode `General_Category` value.
         * @package
         * @param {string} v
         * @return {!vm.d.CharSet | void} */
        vm.loadCategory = function( v ){
            // Canonicalize value name.
            var _v = vm.propertyValueAliasesGeneralCategory[ v ] || v;

            var key = 'General_Category.' + _v;
            var cache = _UNICODE_CACHE[ key ];
            if( cache ){
                return cache;
            };

            var data = vm.unicodeCategory[ _v ];
            if( !data ){
                return;
            };
            var set = vm.createCharSet( data );
            _UNICODE_CACHE[ key ] = set;
            return set;
        };

        /** Load `CharSet` corresponding to Unicode property.
         *
         * Return `null` if property is invalid.
         *
         * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchproperty-p.
         *
         * @package
         * @param {string} p
         * @return {!vm.d.CharSet | void} */
        vm.loadProperty = function( p ){
            // Canonicalize property name.
            p = vm.propertyAliases[ p ] || p;

            var cache = _UNICODE_CACHE[ p ];
            if( cache ){
                return cache;
            };

            var data = vm.unicodeProperty[ p ];
            if( !data ){
                return;
            };

            var set = vm.createCharSet( data );
            _UNICODE_CACHE[ p ] = set;
            return set;
        };

        /** Load `CharSet` corresponding to Unicode property and value.
         *
         * Return `null` if property or value is invalid.
         *
         * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-unicodematchpropertyvalue-p-v.
         *
         * @package
         * @param {string} p
         * @param {string} v
         * @return {!vm.d.CharSet | void} */
        vm.loadPropertyValue = function( p, v ){
            // Canonicalize property name.
            // p = vm.propertyAliases[ p ] || p;

            switch( p ){
                case 'gc' :
                case 'General_Category':
                    return vm.loadCategory( v );
                case 'sc' :
                case 'Script':
                    return _loadScript( v );
                case 'scx' :
                case 'Script_Extensions':
                    return _loadScriptExtensions( v );
            };
        };

        /** Return case-folded code point for ignore-case comparison.
         *
         * @package
         * @param {number} c
         * @param {boolean=} unicode
         * @return {number} */
        vm.canonicalize = function( c, unicode ){
            if( vm.SUPPORT_ES2018 && unicode ){
                return vm.unicodeFoldMap[ c ] || c;
            };

            var s = vm.str.fromCharCode( c );
            var u = s.toUpperCase();
            if( u.length >= 2 ){
                return c;
            };
            var d = u.charCodeAt( 0 );
            if( c >= 0x80 && d < 0x80 ){
                return c;
            };
            return d;
        };

        /**
         * Inverse function of `canonicalize`.
         *
         * It is used for character class matching on ignore-case.
         *
         * @package
         * @param {number} c
         * @param {boolean=} unicode
         * @return {!Array.<number>} */
        vm.uncanonicalize = function( c, unicode ){
            if( vm.SUPPORT_ES2018 && unicode ){
                return vm.unicodeInverseFoldMap[ c ] || [];
            };

            var d = vm.legacyFoldMap[ c ];
            if( d ){
                return d;
            };
            var s = vm.str.fromCharCode( c );
            return [ s.toLowerCase().charCodeAt( 0 ) ];
        };
    }
);
