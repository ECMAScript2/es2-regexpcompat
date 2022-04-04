/**
 * @record
 */
function CharSet(){};

/**
 * @type {number}
 */
CharSet.prototype.length;

/**
 * @type {function(number,number=)}
 */
CharSet.prototype.add;

/**
 * @type {function(CharSet)}
 */
CharSet.prototype.addCharSet;

/**
 * @type {function():CharSet}
 */
CharSet.prototype.invert;

/**
 * @type {function():CharSet}
 */
CharSet.prototype.clone;

/**
 * @type {function(number):boolean}
 */
CharSet.prototype.has;

/**
 * @type {?function(boolean=):string}
 */
CharSet.prototype.toRegExpPattern;

