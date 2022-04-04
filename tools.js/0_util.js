const Path = require( 'path' );
const fs   = require( 'fs' );

module.exports = {
    //export const fromCharCode = (c: number): string => String.fromCharCode(c);
    //export const upper = (c: number): string => fromCharCode(c).toUpperCase();
    //export const lower = (c: number): string => fromCharCode(c).toLowerCase();
    hex : function(n/*: number*/)/*: string => */{ return `0x${n.toString(16).toUpperCase()}` },
    CharSet : new Function(
        fs.readFileSync( Path.resolve( __dirname, '../src.js/0_global/1_DEFINE.js'          ) ) +
        fs.readFileSync( Path.resolve( __dirname, '../src.js/2_moduleGlobal/2_variables.js' ) ) +
        fs.readFileSync( Path.resolve( __dirname, '../src.js/2_moduleGlobal/3_polyfill.js'  ) ) +
        fs.readFileSync( Path.resolve( __dirname, '../src.js/4_char-class/1_escape.js'      ) ) +
        fs.readFileSync( Path.resolve( __dirname, '../src.js/4_char-class/2_CharSet.js'     ) ) +
        ';return function( ary ){ return m_createCharSetFromArray( ary || [] ); };'
    )()
};
