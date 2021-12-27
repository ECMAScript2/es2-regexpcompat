/** `SyntaxError` for `RegExp`. */
class RegExpSyntaxError extends SyntaxError {
  constructor(message) {
    super(`invalid regular expression: ${message}`);
  }
}
