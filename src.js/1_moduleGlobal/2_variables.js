var String_fromCharCode = String.fromCharCode;
var Math_floor = Math.floor;

var m_unicodeFoldMap        = [],
    m_unicodeInverseFoldMap = [];

var m_legacyFoldMap = [], m_unicodeCategory, m_unicodeProperty,
    m_unicodeScript, m_unicodeScriptExtensions;

var m_propertyAliases,
    m_propertyValueAliasesGeneralCategory, m_propertyValueAliasesScript, m_propertyValueAliasesScriptExtensions;

var m_escapeCodePointAsRegExpSpurceChar, CharSet;

var m_loadCategory, m_loadProperty, m_loadPropertyValue;

var m_nodeToString, m_flagSetToString, m_patternToString;

var Match;

/** @typedef {{stylize:Function}} */
var InspectOptionsStylized;
