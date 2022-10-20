module.exports = function(){
    const CharSet = require( './0_util.js' ).CharSet;

    const mapIdStart = require( 'unicode-12.0.0/Binary_Property/ID_Start/code-points.js' );
    const charSetIdStart = new CharSet();
    for( const c of mapIdStart ){
      charSetIdStart.add( c, c + 1 );
    };

    const mapIdContinue = require( 'unicode-12.0.0/Binary_Property/ID_Continue/code-points.js' );
    const charSetIdContinue = new CharSet();
    for( const c of mapIdContinue ){
        charSetIdContinue.add( c, c + 1 );
    };
    return `
if( DEFINE_REGEXP_COMPAT__DEBUG ){
    charSetIdStart = m_createCharSetFromArray(
        CONST_SUPPORT_ES2018 ?
            m_unicodeProperty[ 'ID_Start' ]
            :
            [${charSetIdStart.join( ', ' )}]
    );
};

charSetIdContinue = m_createCharSetFromArray(
    CONST_SUPPORT_ES2018 ?
        m_unicodeProperty[ 'ID_Continue' ]
        :
        [${charSetIdContinue.join( ', ' )}]
);
`;
};
