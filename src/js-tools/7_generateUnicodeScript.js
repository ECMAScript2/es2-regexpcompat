// Link https://www.ecma-international.org/ecma-262/10.0/index.html#table-unicode-script-values.
const SCRIPT = [
    'Adlm',
    'Ahom',
    'Hluw',
    'Arab',
    'Armn',
    'Avst',
    'Bali',
    'Bamu',
    'Bass',
    'Batk',
    'Beng',
    'Bhks',
    'Bopo',
    'Brah',
    'Brai',
    'Bugi',
    'Buhd',
    'Cans',
    'Cari',
    'Aghb',
    'Cakm',
    'Cham',
    'Cher',
    'Zyyy',
    'Qaac',
    'Xsux',
    'Cprt',
    'Cyrl',
    'Dsrt',
    'Deva',
    'Dogr',
    'Dupl',
    'Egyp',
    'Elba',
    'Ethi',
    'Geor',
    'Glag',
    'Goth',
    'Gran',
    'Grek',
    'Gujr',
    'Gong',
    'Guru',
    'Hani',
    'Hang',
    'Rohg',
    'Hano',
    'Hatr',
    'Hebr',
    'Hira',
    'Armi',
    'Qaai',
    'Phli',
    'Prti',
    'Java',
    'Kthi',
    'Knda',
    'Kana',
    'Kali',
    'Khar',
    'Khmr',
    'Khoj',
    'Sind',
    'Laoo',
    'Latn',
    'Lepc',
    'Limb',
    'Lina',
    'Linb',
    'Lisu',
    'Lyci',
    'Lydi',
    'Mahj',
    'Maka',
    'Mlym',
    'Mand',
    'Mani',
    'Marc',
    'Medf',
    'Gonm',
    'Mtei',
    'Mend',
    'Merc',
    'Mero',
    'Plrd',
    'Modi',
    'Mong',
    'Mroo',
    'Mult',
    'Mymr',
    'Nbat',
    'Talu',
    'Newa',
    'Nkoo',
    'Nshu',
    'Ogam',
    'Olck',
    'Hung',
    'Ital',
    'Narb',
    'Perm',
    'Xpeo',
    'Sogo',
    'Sarb',
    'Orkh',
    'Orya',
    'Osge',
    'Osma',
    'Hmng',
    'Palm',
    'Pauc',
    'Phag',
    'Phnx',
    'Phlp',
    'Rjng',
    'Runr',
    'Samr',
    'Saur',
    'Shrd',
    'Shaw',
    'Sidd',
    'Sgnw',
    'Sinh',
    'Sogd',
    'Sora',
    'Soyo',
    'Sund',
    'Sylo',
    'Syrc',
    'Tglg',
    'Tagb',
    'Tale',
    'Lana',
    'Tavt',
    'Takr',
    'Taml',
    'Tang',
    'Telu',
    'Thaa',
    'Thai',
    'Tibt',
    'Tfng',
    'Tirh',
    'Ugar',
    'Vaii',
    'Wara',
    'Yiii',
    'Zanb',
    // 'Zzzz' (alias for 'Unknown') is commented out because it is not listed in the table.
    // However V8 accepts this... (e.g. `/\p{Script=Zzzz}/u.exec('\uFFFF')` matches.)
];

module.exports = function(){
    const matchPropertyValue = require( 'unicode-match-property-value-ecmascript' );
    const CharSet = require( './0_util.js' ).CharSet;

    // Generate output data.
    const script = {};
    const scriptExtensions = {};

    for( const name of SCRIPT ){
        const canonical = matchPropertyValue( 'Script', name );
        const base /*: number[] */ = require( 'unicode-12.0.0/Script/' + canonical + '/code-points.js' );
        const ext /*: number[] */  = require( 'unicode-12.0.0/Script_Extensions/' + canonical + '/code-points.js' );

        const baseSet = new CharSet();
        for( const c of base ){
            baseSet.add( c, c + 1 );
        };
        script[ canonical ] = baseSet.data;

        const extSet = new CharSet();
        for( const c of ext ){
            if( !baseSet.has( c ) ){
                extSet.add( c, c + 1 );
            };
        };
        if( extSet.data.length ){
            scriptExtensions[ canonical ] = extSet.data;
        };
    };
    return 'm_unicodeScript = ' + JSON.stringify( script, null, '    ' ) + ';\n' +
           'm_unicodeScriptExtensions = ' + JSON.stringify( scriptExtensions, null, '    ' ) + ';\n';
};

module.exports.SCRIPT = SCRIPT;
