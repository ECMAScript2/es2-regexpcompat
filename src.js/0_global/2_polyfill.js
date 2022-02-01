/** original:
  *   https://github.com/pettanR/webframework/blob/825d660204644eb99cb54fdc95d6cc66849fce36/js/01_core/00_builtin.js
  */
Function.prototype.apply || (Function.prototype.apply = function (x, y) {
    var apply = '__apply',
        func  = this,
        a, i, r, j;

    x = x || {};
    y = y || [];

    x[ apply ] = func;
    if (!x[ apply ]) x.constructor.prototype[ apply ] = func;
    j = y.length;
    switch (j) {
        case 0: r = x[ apply ](); break;
        case 1: r = x[ apply ](y[0]); break;
        case 2: r = x[ apply ](y[0], y[1]); break;
        case 3: r = x[ apply ](y[0], y[1], y[2]); break;
        case 4: r = x[ apply ](y[0], y[1], y[2], y[3]); break;
        case 5: r = x[ apply ](y[0], y[1], y[2], y[3], y[4]); break;
        case 6: r = x[ apply ](y[0], y[1], y[2], y[3], y[4], y[5]); break;
        case 7: r = x[ apply ](y[0], y[1], y[2], y[3], y[4], y[5], y[6]); break;
        case 8: r = x[ apply ](y[0], y[1], y[2], y[3], y[4], y[5], y[6], y[7]); break;
        case 9: r = x[ apply ](y[0], y[1], y[2], y[3], y[4], y[5], y[6], y[7], y[8]); break;
        default:
            a = [];
            for (i = 0; i < j; ++i)
                a[i] = 'y[' + i + ']';
            //r = eval('x.__apply(' + a.join(',') + ')');
            // closuer compiler 対策
            r = (new Function( 'x,y', 'return x.__apply(' + a.join(',') + ')' ))( x, y );
            break;
    };
    // ie5
    //alert( typeof x );
    if( x.constructor && x.constructor.prototype[ apply ] ){
        delete x.constructor.prototype[ apply ];
    } else
    if( x[ apply ] ) delete x[ apply ];
    return r;
});
