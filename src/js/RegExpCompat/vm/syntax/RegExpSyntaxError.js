goog.provide( 'vm.RegExpSyntaxError' );

goog.require( 'vm.DEFINE.DEBUG' );

vm.RegExpSyntaxError = RegExpSyntaxError;

/** `SyntaxError` for `RegExp`.
 * @constructor
 * @extends SyntaxError
 * @param {string} message */
function RegExpSyntaxError( message ){
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
