if( DEFINE_REGEXP_COMPAT__DEBUG ){
    /** `SyntaxError` for `RegExp`.
     * @constructor
     * @extends SyntaxError
     * @param {string} message
     */
    RegExpSyntaxError = function( message ){
        message = 'invalid regular expression: ' + message;

        SyntaxError.call( this, message );

        this.message = message;
        this.name    = 'RegExpSyntaxError';
        if( Error.captureStackTrace ){
            Error.captureStackTrace( this, RegExpSyntaxError );
        };
    };

    RegExpSyntaxError.prototype = new SyntaxError();
    RegExpSyntaxError.prototype.constructor = RegExpSyntaxError;

    if( DEFINE_REGEXP_COMPAT__NODEJS ){
        module[ 'exports' ][ 'RegExpSyntaxError' ] = RegExpSyntaxError;
    };
};
