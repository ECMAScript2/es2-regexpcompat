if( DEFINE_REGEXP_COMPAT__DEBUG ){
    /** `SyntaxError` for `RegExp`.
     * @constructor
     * @extends SyntaxError
     * @param {string} message
     */
    RegExpSyntaxError = function( message ){
        SyntaxError.call( this, 'invalid regular expression: ' + message );
    };

    if( DEFINE_REGEXP_COMPAT__NODEJS ){
        module[ 'exports' ][ 'RegExpSyntaxError' ] = RegExpSyntaxError;
    };
};
