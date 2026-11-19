goog.provide( 'vm.d.CharSet' );
goog.provide( 'vm.createCharSet' );

goog.require( 'vm.DEFINE.DEBUG' );
goog.require( 'vm.shim.ary.from' );
goog.require( 'vm.math.min' );
goog.require( 'vm.math.max' );
goog.require( 'vm.math.floor' );
goog.require( 'vm.escapeCodePointAsRegExpSourceChar' );

goog.scope(
    function(){
        /**
         * @typedef {{
         *   data            : !Array.<number>,
         *   add             : !function(number,number=),
         *   addCharSet      : !function(!vm.d.CharSet),
         *   invert          : !function():!vm.d.CharSet,
         *   clone           : !function():!vm.d.CharSet,
         *   has             : !function(number):boolean,
         *   toRegExpPattern : ?function(boolean=):string
         * }}
         */
        vm.d.CharSet;

        /** The maximum valid code point of Unicode.
         * @private @const {number} */
        var MAX_CODE_POINT = 0x110000;

        /** `CharSet` is a set of code points. */

        /**
         * Internal data of this.
         *
         * This is a sorted number array.
         * An odd element is begin of a range, and an even element is end of a range.
         * So, this array's size must be even always.
         *
         * ```js
         * var set = vm.createCharSet([]);
         * set.add(10, 20);
         * set.add(30, 40)
         * console.log(set.data);
         * // => [10, 20, 30, 40]
         * ```
         */

        /**
         * @param {!Array.<number>} data
         * @return {!vm.d.CharSet} */
        vm.createCharSet = function( data ){
            var charSet = {
                data       : data,
                add        : CharSet_add,
                addCharSet : CharSet_addCharSet,
                invert     : CharSet_invert,
                clone      : CharSet_clone,
                has        : CharSet_has
            };

            if( vm.DEFINE.DEBUG ){
                charSet.toRegExpPattern = CharSet_toRegExpPattern;
                charSet.toString        = CharSet_toString;
            };

            return /** @type {!vm.d.CharSet} */ (charSet);
        };

        /** Add a range to this.
         * @this {vm.d.CharSet}
         * @param {number} begin
         * @param {number=} opt_end */
        function CharSet_add( begin, opt_end ){
            var data = this.data;
            var end  = opt_end || begin + 1;

            var i = CharSet_searchBegin( data, begin );
            var j = CharSet_searchEnd( data, end );
            var len = ( j - i + 1 ) * 2;

            var removed = data.splice( i * 2, ( j - i + 1 ) * 2 );

            if( removed.length > 0 ){
                begin = vm.math.min( begin, removed[ 0 ] );
                end   = vm.math.max( end, removed[ removed.length - 1 ] );
            };

            data.splice( i * 2, 0, begin, end );
        };

        /** Add another `CharSet` to this.
         * @this {vm.d.CharSet}
         * @param {!vm.d.CharSet} charSet */
        function CharSet_addCharSet( charSet ){
            var newData = charSet.data,
                begin, end;

            for( var i = -1, l = newData.length - 1; i < l; ){
                begin = newData[ ++i ];
                end   = newData[ ++i ];
                this.add( begin, end );
            };
        };

        /** Invert this set.
         *
         * Note that this method is mutable like `Array.prototype.reverse`.
         * Please clone before this if immutable is desired.
         *
         * @this {vm.d.CharSet}
         * @return {!vm.d.CharSet} */
        function CharSet_invert(){
            var data = this.data;

            if( data.length === 0 ){
                data.push( 0, MAX_CODE_POINT );
                return this;
            };
            if( data[ 0 ] === 0 && data[ data.length - 1 ] === MAX_CODE_POINT ){
                data.shift();
                data.pop();
                return this;
            };
            data.unshift( 0 );
            data.push( MAX_CODE_POINT );

            return this;
        };

        /** Clone this set.
         * @this {vm.d.CharSet}
         * @return {!vm.d.CharSet} */
        function CharSet_clone(){
            return vm.createCharSet( /** @type {!Array.<number>} */ (vm.shim.ary.from( this.data )) );
        };

        /** Check is a code point contained in this set.
         * @this {vm.d.CharSet}
         * @param {number} c
         * @return {boolean} */
        function CharSet_has( c ){
            var data = this.data;
            var i = CharSet_searchEnd( data, c );

            if( i < 0 || data.length <= i * 2 ){
                return false;
            };
            var begin = data[ i * 2 ];
            var end   = data[ i * 2 + 1 ];

            return begin <= c && c < end;
        };

        /** Convert this into `RegExp` char-class pattern string.
         *
         * @this {vm.d.CharSet}
         * @param {boolean=} opt_invert
         * @return {string} */
        function CharSet_toRegExpPattern( opt_invert ){
            var s = opt_invert ? '[^' : '[';

            for( var i = -1, data = this.data, l = data.length - 1; i < l; ){
                var begin = data[ ++i ];
                var end   = data[ ++i ];
                s += vm.escapeCodePointAsRegExpSourceChar( begin, true );
                if( begin !== end - 1 ){
                    s += '-' + vm.escapeCodePointAsRegExpSourceChar( end - 1, true );
                };
            };

            return s + ']';
        };

        /** @this {vm.d.CharSet} */
        function CharSet_toString(){
            return 'CharSet' + this.toRegExpPattern();
        };

        /** Find the least `i` such that satisfy `c <= this.data[i * 2 + 1]`.
         * @param {!Array.<number>} data
         * @param {number} c
         * @return {number} */
        function CharSet_searchBegin( data, c ){
            var min = -1;
            var max = data.length / 2;
            var mid;

            while( max - min > 1 ){
                mid = min + vm.math.floor( ( max - min ) / 2 );
                if( c <= data[ mid * 2 + 1 ] ){
                    max = mid;
                } else {
                    min = mid;
                };
            };
            return max;
        };

        /** Find the maximum `j` such that satisfy `this.ranges[j * 2] <= c`.
         * @param {!Array.<number>} data
         * @param {number} c
         * @return {number} */
        function CharSet_searchEnd( data, c ){
            var min = -1;
            var max = data.length / 2;
            var mid;

            while( max - min > 1 ){
                mid = min + vm.math.floor( ( max - min ) / 2 );
                if( data[ mid * 2 ] <= c ){
                    min = mid;
                } else {
                    max = mid;
                };
            };
            return min;
        };
    }
);
