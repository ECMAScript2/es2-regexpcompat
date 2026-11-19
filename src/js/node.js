goog.provide( 'RegExpCompat.node' );

/* goog.require( 'vm.patternToString' );
goog.require( 'vm.escapeCodePointAsRegExpSourceChar' );
goog.require( 'vm.codesToString' );
goog.require( 'vm.loadProperty' );
goog.require( 'vm.loadPropertyValue' );
goog.require( 'vm.Parser' );
goog.require( 'vm.Match' );
goog.require( 'vm.Program' );
goog.require( 'vm.Compiler' ); */
goog.require( 'RegExpCompat' );

/** @private @typedef {{stylize:Function}} */
var InspectOptionsStylized;

/**
 * @private
 * @this {vm.d.CharSet}
 * @param {*} depth 
 * @param {!InspectOptionsStylized} options
 * @return {string} */
function CharSet_inspect( depth, options ){
    return options.stylize( 'CharSet', 'special' ) + ' ' + options.stylize( this.toRegExpPattern(), 'regexp' );
};

module.exports[ 'RegExpCompat'      ] = RegExpCompat;
module.exports[ 'patternToString'   ] = vm.patternToString;
module.exports[ 'escape'            ] = vm.escapeCodePointAsRegExpSourceChar;
/** @suppress {visibility} */
module.exports[ 'codesToString'     ] = vm.codesToString;
/** @suppress {visibility} */
module.exports[ 'loadProperty'      ] = vm.loadProperty;
/** @suppress {visibility} */
module.exports[ 'loadPropertyValue' ] = vm.loadPropertyValue;
module.exports[ 'Parser'            ] = vm.Parser;
module.exports[ 'RegExpSyntaxError' ] = vm.RegExpSyntaxError;
/** @suppress {visibility} */
module.exports[ 'Match'             ] = vm.Match;
/** @suppress {visibility} */
module.exports[ 'Program'           ] = vm.Program;
module.exports[ 'Compiler'          ] = vm.Compiler;
module.exports[ 'CharSet'           ] = function( data ){
    var charSet = vm.createCharSet( data || [] );

    if( vm.DEFINE.DEBUG ){
        charSet[ Symbol[ 'for' ]( 'nodejs.util.inspect.custom' ) ] = CharSet_inspect;
    };
    return charSet;
};

if( vm.DEFINE.DEBUG ){
    /**
     * @suppress {visibility}
     *
     * @param {*} depth 
     * @param {!InspectOptionsStylized} options 
     * @return {string} */
    vm.Match.prototype[ Symbol[ 'for' ]( 'nodejs.util.inspect.custom' ) ] = function( depth, options ){
        var s = options.stylize( 'Match', 'special' ) + ' [\n';
        var names = vm.SUPPORT_ES2018 ? this._names : [];

        function getNameByIndex( index ){
            var _index = names.indexOf( index );

            return _index === -1 ? null : names[ _index - 1 ];
        };

        for( var i = 0, _i; i < this.length; i++ ){
            _i = getNameByIndex( i );
            var name = options.stylize(
                JSON.stringify( _i != null ? _i : i ),
                _i != null ? 'string' : 'number'
            );
            var capture = this.get( i );
            if( capture === undefined ){
                s += '  ' + name + ' => ' + options.stylize( 'undefined', 'undefined' ) + ',\n';
                continue;
            };
            var begin = options.stylize( this._caps[ i * 2 ].toString(), 'number' );
            var end = options.stylize( this._caps[ i * 2 + 1 ].toString(), 'number' );
            capture = options.stylize( JSON.stringify( capture ), 'string' );
            s += '  ' + name + ' [' + begin + ':' + end + '] => ' + capture + ',\n';
        };
        return s + ']';
    };

    /**
     * @suppress {visibility}
     *
     * @param {*} depth
     * @param {!InspectOptionsStylized} options
     * @return {string} */
    vm.Program.prototype[ Symbol[ 'for' ]( 'nodejs.util.inspect.custom' ) ] = function( depth, options ){
        var pattern = options.stylize( vm.patternToString( this.pattern ), 'regexp' );
        /** @suppress {visibility} */
        var codes = vm.codesToString( this.codes )
                        .split('\n')
                        .map( function( line ){ return options.stylize( line, 'string' ); } )
                        .join('\n    ');

        return options.stylize( 'Program', 'special' ) + ' {\n' +
            '  pattern: ' + pattern + ',\n' +
            '  codes:\n' +
            '    ' + codes + '\n' +
            '}';
    };
};
