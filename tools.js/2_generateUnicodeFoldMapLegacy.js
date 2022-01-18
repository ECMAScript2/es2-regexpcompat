/*
 * A generator for `src/data/legacy.ts` data.
 *
 * This script generates `inverseFoldMap` table. This table is utility
 * to calculate inverse of `canonicalize` function for character class
 * ignore-case matching on legacy (non-`unicode`) mode. In almost all
 * cases, `String.prototype.toLowerCase` works for this purpose,
 * however some characters need special treatment. (e.g. both of
 * `canonicalize('ǳ')` and `canonicalize('ǲ')` returns the same `'Ǳ'`,
 * so inverse of `canonicalize` for `'Ǳ'` must be `'ǳ'` and `'ǲ'`.)
 *
 * See https://www.ecma-international.org/ecma-262/10.0/index.html#sec-runtime-semantics-canonicalize-ch.
 */
module.exports = function(){
    const hex = require( './0_util.js' ).hex;

    function canonicalize( c ){
        const u = String.fromCharCode( c ).toUpperCase();
        if( u.length >= 2 ){
            return c;
        };
        const d = u.charCodeAt( 0 );
        if( c >= 0x80 && d < 0x80 ){
            return c;
        };
        return d;
    };
    
    // Build `foldMap` table which is map from a character to its canonicalized.
    const foldMap = new Map;
    for( let c = 0; c < 0xffff; c++ ){
        const d = canonicalize( c );
        if( c !== d ){
            foldMap.set( c, d );
        };
    };
  
    // Calculate a simple version of `inverseFoldMap` and its domain.
    const simpleInverseFoldMap = new Map;
    const rangeOfFoldMap = new Set; // means domainOfInverseFoldMap
    for( const [c, d] of foldMap ){
        let array = simpleInverseFoldMap.get( d );
        if( !array ){
            array = [];
            simpleInverseFoldMap.set( d, array );
        };
        array.push( c );
        rangeOfFoldMap.add( d );
    };
    
      // Calculate `inverseFoldMap`.
    const inverseFoldMap = new Map;
    for( const c of rangeOfFoldMap ){
        const d = simpleInverseFoldMap.get( c );
        if( !d ){
            throw new Error('BUG: unexpected undefined');
        };
        if( d.length === 1 && String.fromCharCode( c ).toLowerCase() === String.fromCharCode( d[ 0 ] ) ){
            // Ignore this case because `String.prototype.toLowerCase` works.
            continue;
        } else {
            inverseFoldMap.set( c, d );
        };
    };
    
    // Generate output data.
    let src = '';

    for( const [ c, d ] of inverseFoldMap ){
        src += 'm_legacyFoldMap[ ' + hex( c ) + ' ] = [ ' + d.map( hex ).join( ', ' ) + ' ];\n';
    };
    return src;
};
