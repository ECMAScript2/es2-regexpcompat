goog.provide( 'vm.Match' );

goog.require( 'vm.SUPPORT_ES2018' );
goog.require( 'vm.getCaptureGroupIndexByName' );
goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.shim.ary.map' );

goog.scope(
    function(){
        /** Resolve name to capture index.
         *
         * If not resolved, it returns `-1`.
         * 
         * @param {!vm.Match} match
         * @param {string|number} k 
         * @return {!Array.<number>} */
        function _resolve( match, k ){
            if( vm.SUPPORT_ES2018 && k === k + '' ){ // typeof k === 'string'
                k = vm.getCaptureGroupIndexByName( /** @type {!Array.<string | number>} */ (match._names), k ); //
            };
            var i = match._caps[ k * 2 ],
                j = match._caps[ k * 2 + 1 ];

            return [ i !== undefined ? i : -1, j !== undefined ? j : -1 ];
        };

        /** `Match` is result data of regular expression pattern matching.
         *
         * @package
         * @constructor
         * @param {string} input 
         * @param {!Array.<number>} caps 
         * @param {!Array.<string | number>=} names */
        vm.Match = function( input, caps, names ){
            /** An input string of this matching.
             * @type {string} */
            this.input = input;
            this._caps = caps;

            if( vm.SUPPORT_ES2018 ){
                this._names = names;
            };

            /** Return the initial index of this matching.
             * @type {number} */
            this.index = caps[ 0 ];
            /** Return the last index of this matching.
             * @type {number} */
            this.lastIndex = caps[ 1 ];
            /** Return number of capture group.
             *
             * This number contains capture `0` (whole matching) also.
             * @type {number} */
            this.length = caps.length / 2;
        };

        /** Get the capture `k`.
         * @param {(string|number)} k
         * @return {(string | void)} */
        vm.Match.prototype.get = function( k ){
            var result = _resolve( this, k ),
                i      = result[ 0 ],
                j      = result[ 1 ];

            if( i < 0 || j < 0 ){
                return undefined;
            };
            return this.input.slice( i, j );
        };

        if( vm.DEFINE.DEBUG ){
            /** Get the begin index of the capture `k`.
             * @param {(string|number)} k
             * @return {(number | void)} */
            vm.Match.prototype.begin = function( k ){
                var i = _resolve( this, k )[ 0 ];

                return i < 0 ? undefined : i;
            };

            /** Get the end index of the capture `k`.
             * @param {(string|number)} k
             * @return {(number | void)} */
            vm.Match.prototype.end = function( k ){
                var j = _resolve( this, k )[ 1 ];

                return j < 0 ? undefined : j;
            };
        };

        /** Convert this into `RegExp`'s result array.
         * @return {!RegExpResult} */
        vm.Match.prototype.toArray = function(){
            // In TypeScript definition, `RegExpExecArray` extends `string[]`.
            // However the **real** `RegExpExecArray` can contain `undefined`.
            // So this method uses type casting to set properties.

            var l     = this.length;
            var array = [];
            array.index = this.index;
            array.input = this.input;

            for( var i = 0; i < l; ++i ){
                array[ i ] = this.get( i );
            };

            if( vm.SUPPORT_ES2018 ){
                var names = this._names;

                l = names.length;
                if( 0 < l ){
                    var groups = {}; // <- Object.create( null ),

                    for( i = 0; i < l; i += 2 ){
                        groups[ /** @type {string} */ (names[ i ]) ] = array[ /** @type {number} */ (names[ i + 1 ]) ];
                    };

                    // `RegExpExecArray`'s group does not accept `undefined` value, so cast to `any` for now.
                    array.groups = groups;
                } else if( vm.DEFINE.DEBUG ){
                    array.groups = undefined;
                };
            } else if( vm.DEFINE.DEBUG ){
                array.groups = undefined;
            };

            return /** @type {!RegExpResult} */ (array);
        };

        if( vm.DEFINE.DEBUG ){
            vm.Match.prototype.toString = function(){
                var array = this.toArray();

                function show( x ){
                    return x === undefined ? 'undefined' : JSON.stringify( x );
                };
                return 'Match[' + vm.shim.ary.map( array, show ).join( ', ' ) + ']';
            };
        };
    }
);