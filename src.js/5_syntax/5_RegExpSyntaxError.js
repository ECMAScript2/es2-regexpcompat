if( DEFINE_REGEXP_COMPAT__DEBUG ){
    /** `SyntaxError` for `RegExp`.
     * @constructor
     * @extends SyntaxError
     * @param {string} message
     */
    RegExpSyntaxError = function( message ){
        SyntaxError.call( this, 'invalid regular expression: ' + message );
    };
};
