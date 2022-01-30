/** `SyntaxError` for `RegExp`.
 * @constructor
 * @extends SyntaxError
 * @param {string} message
 */
RegExpSyntaxError = function( message ){
    SyntaxError.call( this, 'invalid regular expression: ' + message );
};
