// Link https://www.ecma-international.org/ecma-262/10.0/index.html#table-unicode-general-category-values.
const PROPERTY = [
    'ASCII',
    'AHex',
    'Alpha',
    'Any',
    'Assigned',
    'Bidi_C',
    'Bidi_M',
    'CI',
    'Cased',
    'CWCF',
    'CWCM',
    'CWL',
    'CWKCF',
    'CWT',
    'CWU',
    'Dash',
    'DI',
    'Dep',
    'Dia',
    'Emoji',
    'Emoji_Component',
    'Emoji_Modifier',
    'Emoji_Modifier_Base',
    'Emoji_Presentation',
    'Extended_Pictographic',
    'Ext',
    'Gr_Base',
    'Gr_Ext',
    'Hex',
    'IDSB',
    'IDST',
    'IDC',
    'IDS',
    'Ideo',
    'Join_C',
    'LOE',
    'Lower',
    'Math',
    'NChar',
    'Pat_Syn',
    'Pat_WS',
    'QMark',
    'Radical',
    'RI',
    'STerm',
    'SD',
    'Term',
    'UIdeo',
    'Upper',
    'VS',
    'space',
    'XIDC',
    'XIDS'
];

module.exports = function(){
    const propertyAliases = require( 'unicode-property-aliases-ecmascript' );
    const CharSet = require( './0_util.js' ).CharSet;

    // Generate output data.
    var property = {};

    for( const name of PROPERTY ){
        const canonical = propertyAliases.get(name) ?? name;
        const data/* : number[] */ = require( 'unicode-12.0.0/Binary_Property/' + canonical + '/code-points.js' );

        const set = new CharSet();
        for( const c of data ){
            set.add(c, c + 1);
        };
        property[ canonical ] = set.data;
    };
    return 'm_unicodeProperty =\n' + JSON.stringify( property, null, '    ' ) + ';\n';
};

module.exports.PROPERTY = PROPERTY;
