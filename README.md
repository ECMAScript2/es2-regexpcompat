# ES2 RegExpCompat

Implementation of `RegExp` for browsers up to ECMAScript 2(Internet Exproler 4.0, JScript 3.0, JavaScript 1.3).

This project is based on [ReRE.js](https://github.com/makenowjust/rerejs/) by [makenowjust](https://github.com/makenowjust).

## Closure Compiler `@define` s

| Variable Name                     | Data Type    | Default Value | Options                                | Description                   |
|:----------------------------------|:-------------|:--------------|:---------------------------------------|:------------------------------|
| `vm.DEFINE.DEBUG`                 | `boolean`    | `false`       |                                        | Set `true` for debug build.   |
| `vm.DEFINE.MINIFY`                | `boolean`    | `true`        |                                        | Set `true` for minimum build. |
| `vm.DEFINE.CLIENT_MIN_ES_VERSION` | `number`     | `2`           | `2`, `3`, `5`, `6`, `2015`(=6), `2018` | Target ES Version             |
| `vm.DEFINE.ES_FEATURE_VERSION`    | `number`     | `2018`        |      `3`, `5`, `6`, `2015`(=6), `2018` | ES fuature version            |

## Build

~~~
gulp dist
~~~

## Test

~~~
npm test
~~~

## Links

1. [es2-code-prettify](https://github.com/ECMAScript2/es2-code-prettify)
   * Dynamically adds `RegExpCompat` only to the required environments (IE <5.5, Gecko <0.9, Opera <8). This is the usage envisioned by this project.

## License

ES2 RegExpCompat is licensed under [MIT License](https://opensource.org/licenses/MIT).

(C) 2022-2026 [itozyun](https://github.com/itozyun)([outcloud.blogspot.com](//outcloud.blogspot.com/))
