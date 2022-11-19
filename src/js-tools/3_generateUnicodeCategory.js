// Link https://www.ecma-international.org/ecma-262/10.0/index.html#table-unicode-general-category-values.
const CATEGORY = [
    'LC',
    'Pe',
    'Pc',
    'Cc',
    'Sc',
    'Pd',
    'Nd',
    'Me',
    'Pf',
    'Cf',
    'Pi',
    'L',
    'Nl',
    'Zl',
    'Ll',
    'M',
    'Sm',
    'Lm',
    'Sk',
    'Mn',
    'N',
    'Ps',
    'C',
    'Lo',
    'No',
    'Po',
    'So',
    'Zp',
    'Co',
    'P',
    'Z',
    'Zs',
    'Mc',
    'Cs',
    'S',
    'Lt',
    'Cn',
    'Lu'
];
  
module.exports = function(){
    const matchPropertyValue = require( 'unicode-match-property-value-ecmascript' );
    const CharSet    = require( './0_util.js' ).CharSet;

    // Generate output data.
    var category = {};

    for( const name of CATEGORY ){
        const canonical = matchPropertyValue( 'General_Category', name );
        const data/* : number[] */ = require( 'unicode-12.0.0/General_Category/' + canonical + '/code-points.js' );

        const set = new CharSet();
        for( const c of data ){
            set.add(c, c + 1);
        };
        category[ canonical ] = set.data;
    };
    return 'm_unicodeCategory =\n' + JSON.stringify( category, null, '    ' ) + ';\n';
};

module.exports.CATEGORY = CATEGORY;
