/** `SyntaxError` for `RegExp`.
 * @constructor
 * @extends SyntaxError
 * @param {string} message
 */
function RegExpSyntaxError( message ){
    SyntaxError.call( this, 'invalid regular expression: ' + message );
};
