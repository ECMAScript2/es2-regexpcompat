var String_fromCharCode = String.fromCharCode;
var Math_floor = Math.floor; // function( n ){ return n <= 0x7FFFFFFF ? ( n | 0 ) : Math.floor( n ) };

// Math_min, Math_max

var m_unicodeFoldMap        = [],
    m_unicodeInverseFoldMap = [],
    m_legacyFoldMap         = [];

var m_unicodeCategory, m_unicodeProperty,
    m_unicodeScript, m_unicodeScriptExtensions;

var m_propertyAliases,
    m_propertyValueAliasesGeneralCategory, m_propertyValueAliasesScript, m_propertyValueAliasesScriptExtensions;

var m_escapeCodePointAsRegExpSpurceChar, m_createCharSetFromArray;

var m_charSetDigit, m_charSetInvertDigit,
    m_charSetWord, m_charSetInvertWord,
    m_charSetUnicodeWord, m_charSetInvertUnicodeWord,
    m_charSetSpace, m_charSetInvertSpace;

var m_loadCategory, m_loadProperty, m_loadPropertyValue;

var m_nodeToString, m_flagSetToString, m_patternToString;

var m_getCaptureGroupIndexByName;

var RegExpSyntaxError, Parser, Compiler, Program;

/** @typedef {{stylize:Function}} */
var InspectOptionsStylized;

if( DEFINE_REGEXP_COMPAT__NODEJS ){
    module[ 'exports' ] = {};
};
