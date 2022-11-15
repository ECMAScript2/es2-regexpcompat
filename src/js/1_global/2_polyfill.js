/** original:
  *   https://github.com/pettanR/webframework/blob/825d660204644eb99cb54fdc95d6cc66849fce36/js/01_core/00_builtin.js
  * 
  * ADVANCED compile 不可!
  */
Function.prototype.apply || (Function.prototype.apply = function (_x, _y) {
    var f = this,
        x = _x || {},
        y = _y || [],
        j = y.length,
        i = 0, r;

    x.__apply = f;
    if (!x.__apply) x.constructor.prototype.__apply = f;
    switch (j) {
        case 0: r = x.__apply(); break;
        case 1: r = x.__apply(y[0]); break;
        case 2: r = x.__apply(y[0], y[1]); break;
        case 3: r = x.__apply(y[0], y[1], y[2]); break;
        case 4: r = x.__apply(y[0], y[1], y[2], y[3]); break;
        case 5: r = x.__apply(y[0], y[1], y[2], y[3], y[4]); break;
        case 6: r = x.__apply(y[0], y[1], y[2], y[3], y[4], y[5]); break;
        case 7: r = x.__apply(y[0], y[1], y[2], y[3], y[4], y[5], y[6]); break;
        case 8: r = x.__apply(y[0], y[1], y[2], y[3], y[4], y[5], y[6], y[7]); break;
        case 9: r = x.__apply(y[0], y[1], y[2], y[3], y[4], y[5], y[6], y[7], y[8]); break;
        default:
            r = [];
            for (; i < j; ++i)
                r[i] = 'y[' + i + ']';
            r = eval('x.__apply(' + r.join(',') + ')');
            // closuer compiler 対策
            // r = (new Function( 'x,y', 'return x.__apply(' + a.join(',') + ')' ))( x, y );
            break;
    };
    if( x.constructor && x.constructor.prototype.__apply ){
        delete x.constructor.prototype.__apply;
    } else
    if( x.__apply ) delete x.__apply;
    return r;
});
