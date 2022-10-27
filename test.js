const lib = require('./lib/index.develop.js');

console.dir(lib)

console.log(
    new RegExp(lib.escape(0)).test(String.fromCodePoint(0))
)
